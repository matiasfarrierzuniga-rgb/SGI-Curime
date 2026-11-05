import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import {
  TERRITORIAL_CATALOG_SCHEMA_VERSION,
  type CatalogLocality,
  type TerritorialCatalog,
  type TerritorialCatalogManifest,
} from './territorial-catalog.types';

const REQUIRED_DBF_FIELDS = [
  'NOMB_UGEP',
  'NOMB_UGEC',
  'NOMB_UGED',
  'COD_UGED',
  'NOMB_LOC',
  'DESCR_CAT',
];
export const INEC_LOCALIDADES_2024_URL =
  'https://admin.inec.cr/sites/default/files/2025-01/Localidades%202024.zip';

export type InMemoryZip = Map<string, Buffer>;
type DistrictBuild = { name: string; localities: CatalogLocality[] };
type CantonBuild = Map<string, DistrictBuild>;
type ProvinceBuild = Map<string, CantonBuild>;
export type GeneratorInput = {
  zip: Buffer;
  sourceUrl: string;
  expectedSha256: string;
  catalogVersion: string;
  expectedSourceDate: string;
};

const sha256 = (value: Buffer | string) =>
  createHash('sha256').update(value).digest('hex');
const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-CR');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
const decodeDbfText = (value: Buffer) => {
  try {
    return utf8Decoder.decode(value).trim();
  } catch {
    return value.toString('latin1').trim();
  }
};

export function localityKey(
  catalogVersion: string,
  districtCode: string,
  name: string,
  category: string,
) {
  const scopedIdentity = [
    catalogVersion,
    districtCode,
    normalize(name),
    normalize(category),
  ].join('|');
  return `loc_${sha256(scopedIdentity).slice(0, 24)}`;
}

function unpackZip(zip: Buffer): InMemoryZip {
  const eocdSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocdOffset = zip.lastIndexOf(eocdSignature);
  if (eocdOffset >= 0) {
    const files: InMemoryZip = new Map();
    const entries = zip.readUInt16LE(eocdOffset + 10);
    let centralOffset = zip.readUInt32LE(eocdOffset + 16);
    for (let index = 0; index < entries; index += 1) {
      if (zip.readUInt32LE(centralOffset) !== 0x02014b50)
        throw new Error('ZIP central directory is invalid');
      const flags = zip.readUInt16LE(centralOffset + 8);
      const method = zip.readUInt16LE(centralOffset + 10);
      const compressedSize = zip.readUInt32LE(centralOffset + 20);
      const uncompressedSize = zip.readUInt32LE(centralOffset + 24);
      const nameLength = zip.readUInt16LE(centralOffset + 28);
      const extraLength = zip.readUInt16LE(centralOffset + 30);
      const commentLength = zip.readUInt16LE(centralOffset + 32);
      const localOffset = zip.readUInt32LE(centralOffset + 42);
      if ((flags & 0x01) !== 0) throw new Error('Encrypted ZIP entries are not supported');
      const name = zip
        .subarray(centralOffset + 46, centralOffset + 46 + nameLength)
        .toString('utf8');
      if (zip.readUInt32LE(localOffset) !== 0x04034b50)
        throw new Error(`ZIP local entry is invalid: ${name}`);
      const localNameLength = zip.readUInt16LE(localOffset + 26);
      const localExtraLength = zip.readUInt16LE(localOffset + 28);
      const payloadStart = localOffset + 30 + localNameLength + localExtraLength;
      const payload = zip.subarray(payloadStart, payloadStart + compressedSize);
      const content =
        method === 0
          ? payload
          : method === 8
            ? inflateRawSync(payload)
            : undefined;
      if (!content || content.length !== uncompressedSize)
        throw new Error(`Unsupported or invalid ZIP entry: ${name}`);
      files.set(name, content);
      centralOffset += 46 + nameLength + extraLength + commentLength;
    }
    return files;
  }

  const files: InMemoryZip = new Map();
  let offset = 0;
  while (offset + 30 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const flags = zip.readUInt16LE(offset + 6);
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const uncompressedSize = zip.readUInt32LE(offset + 22);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    if ((flags & 0x08) !== 0)
      throw new Error('ZIP data descriptors are not supported');
    const name = zip
      .subarray(offset + 30, offset + 30 + nameLength)
      .toString('utf8');
    const payloadStart = offset + 30 + nameLength + extraLength;
    const payload = zip.subarray(payloadStart, payloadStart + compressedSize);
    const content =
      method === 0
        ? payload
        : method === 8
          ? inflateRawSync(payload)
          : undefined;
    if (!content || content.length !== uncompressedSize)
      throw new Error(`Unsupported or invalid ZIP entry: ${name}`);
    files.set(name, content);
    offset = payloadStart + compressedSize;
  }
  return files;
}

function readDbf(dbf: Buffer): Array<Record<string, string>> {
  if (dbf.length < 33) throw new Error('DBF is truncated');
  const records = dbf.readUInt32LE(4);
  const headerLength = dbf.readUInt16LE(8);
  const recordLength = dbf.readUInt16LE(10);
  const fields: Array<{ name: string; length: number }> = [];
  for (
    let position = 32;
    position < headerLength && dbf[position] !== 0x0d;
    position += 32
  ) {
    fields.push({
      name: dbf
        .subarray(position, position + 11)
        .toString('ascii')
        .replace(/\0.*$/, ''),
      length: dbf[position + 16],
    });
  }
  for (const field of REQUIRED_DBF_FIELDS)
    if (!fields.some((entry) => entry.name === field))
      throw new Error(`Missing required DBF field: ${field}`);
  const rows: Array<Record<string, string>> = [];
  for (let index = 0; index < records; index += 1) {
    const start = headerLength + index * recordLength;
    if (start + recordLength > dbf.length)
      throw new Error('DBF record is truncated');
    if (dbf[start] === 0x2a) continue;
    let position = start + 1;
    const row: Record<string, string> = {};
    for (const field of fields) {
      row[field.name] = decodeDbfText(
        dbf.subarray(position, position + field.length),
      );
      position += field.length;
    }
    rows.push(row);
  }
  return rows;
}

export function generateTerritorialCatalog(input: GeneratorInput): {
  catalog: TerritorialCatalog;
  manifest: TerritorialCatalogManifest;
  artifact: string;
} {
  if (input.sourceUrl !== INEC_LOCALIDADES_2024_URL)
    throw new Error('INEC source URL does not match approved distribution URL');
  if (sha256(input.zip) !== input.expectedSha256)
    throw new Error('INEC archive SHA-256 does not match approved value');
  const files = unpackZip(input.zip);
  const dbf = files.get('Localidades.dbf');
  const metadata = files.get('Metadato_Localidades.xml')?.toString('utf8');
  if (!dbf || !metadata)
    throw new Error(
      'INEC ZIP must include Localidades.dbf and Metadato_Localidades.xml',
    );
  if (
    !metadata.includes(input.expectedSourceDate) &&
    !metadata.includes(input.expectedSourceDate.split('-').reverse().join('/'))
  )
    throw new Error(
      'INEC metadata source date does not match approved version',
    );
  const localities = new Map<
    string,
    {
      provinceCode: string;
      provinceName: string;
      cantonCode: string;
      cantonName: string;
      districtCode: string;
      districtName: string;
      name: string;
      category: string;
    }
  >();
  for (const row of readDbf(dbf)) {
    const districtCode = row.COD_UGED;
    if (!/^\d{5}$/.test(districtCode))
      throw new Error(`Invalid COD_UGED: ${districtCode}`);
    const entry = {
      provinceCode: districtCode.slice(0, 1),
      provinceName: normalize(row.NOMB_UGEP),
      cantonCode: districtCode.slice(1, 3),
      cantonName: normalize(row.NOMB_UGEC),
      districtCode: districtCode.slice(3, 5),
      districtName: normalize(row.NOMB_UGED),
      name: normalize(row.NOMB_LOC),
      category: normalize(row.DESCR_CAT),
    };
    if (
      !entry.provinceName ||
      !entry.cantonName ||
      !entry.districtName ||
      !entry.name ||
      !entry.category
    )
      continue;
    localities.set(
      [
        entry.provinceCode,
        entry.cantonCode,
        entry.districtCode,
        entry.name,
        entry.category,
      ].join('|'),
      entry,
    );
  }
  const provinces = new Map<string, ProvinceBuild>();
  for (const entry of [...localities.values()].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  )) {
    const cantonKey = `${entry.cantonCode}|${entry.cantonName}`;
    const districtKey = `${entry.districtCode}|${entry.districtName}`;
    const province =
      provinces.get(`${entry.provinceCode}|${entry.provinceName}`) ??
      new Map<string, CantonBuild>();
    const canton = province.get(cantonKey) ?? new Map<string, DistrictBuild>();
    const district = canton.get(districtKey) ?? {
      name: entry.districtName,
      localities: [],
    };
    district.localities.push({
      localityKey: localityKey(
        input.catalogVersion,
        `${entry.provinceCode}${entry.cantonCode}${entry.districtCode}`,
        entry.name,
        entry.category,
      ),
      name: entry.name,
      category: entry.category,
    });
    canton.set(districtKey, district);
    province.set(cantonKey, canton);
    provinces.set(`${entry.provinceCode}|${entry.provinceName}`, province);
  }
  const catalog: TerritorialCatalog = {
    schemaVersion: TERRITORIAL_CATALOG_SCHEMA_VERSION,
    catalogVersion: input.catalogVersion,
    source: {
      title: 'INEC Localidades 2024',
      url: input.sourceUrl,
      sourceDate: input.expectedSourceDate,
      archiveSha256: input.expectedSha256,
    },
    provinces: [...provinces.entries()].sort().map(([key, cantons]) => {
      const [code, name] = key.split('|');
      return {
        code,
        name,
        cantons: [...cantons.entries()].sort().map(([cantonKey, districts]) => {
          const [cantonCode, cantonName] = cantonKey.split('|');
          return {
            code: cantonCode,
            name: cantonName,
            districts: [...districts.entries()]
              .sort()
              .map(([districtKey, district]) => {
                const [districtCode, districtName] = districtKey.split('|');
                return {
                  code: districtCode,
                  name: districtName,
                  localities: district.localities.sort((a, b) =>
                    `${a.name}|${a.category}`.localeCompare(
                      `${b.name}|${b.category}`,
                    ),
                  ),
                };
              }),
          };
        }),
      };
    }),
  };
  const artifact = json(catalog);
  const artifactHash = sha256(artifact);
  return {
    catalog,
    artifact,
    manifest: {
      generatorSchemaVersion: TERRITORIAL_CATALOG_SCHEMA_VERSION,
      catalogVersion: input.catalogVersion,
      source: {
        title: catalog.source.title,
        url: input.sourceUrl,
        sourceDate: input.expectedSourceDate,
        archiveSha256: input.expectedSha256,
      },
      artifactSha256: artifactHash,
    },
  };
}
