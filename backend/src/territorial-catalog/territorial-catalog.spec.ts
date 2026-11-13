import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  generateTerritorialCatalog,
  INEC_LOCALIDADES_2024_URL,
  localityKey,
} from './territorial-catalog.generator';
import { TerritorialCatalogController } from './territorial-catalog.controller';
import { TerritorialCatalogModule } from './territorial-catalog.module';
import {
  DEFAULT_TERRITORIAL_CATALOG_MANIFEST_PATH,
  DEFAULT_TERRITORIAL_CATALOG_PATH,
} from './territorial-catalog.paths';
import { TerritorialCatalogService } from './territorial-catalog.service';

const hash = (value: Buffer) =>
  createHash('sha256').update(value).digest('hex');
function dbf(rows: Array<Record<string, string>>) {
  const fields = [
    ['NOMB_UGEP', 20],
    ['NOMB_UGEC', 20],
    ['NOMB_UGED', 20],
    ['COD_UGED', 5],
    ['NOMB_LOC', 30],
    ['DESCR_CAT', 20],
  ] as const;
  const header = 32 + fields.length * 32 + 1;
  const record = 1 + fields.reduce((total, [, length]) => total + length, 0);
  const out = Buffer.alloc(header + record * rows.length + 1);
  out[0] = 3;
  out.writeUInt32LE(rows.length, 4);
  out.writeUInt16LE(header, 8);
  out.writeUInt16LE(record, 10);
  fields.forEach(([name, length], index) => {
    const offset = 32 + index * 32;
    out.write(name, offset);
    out[offset + 11] = 0x43;
    out[offset + 16] = length;
  });
  out[header - 1] = 0x0d;
  rows.forEach((row, index) => {
    let offset = header + index * record + 1;
    fields.forEach(([name, length]) => {
      out.write(
        (row[name] ?? '').padEnd(length, ' ').slice(0, length),
        offset,
        'latin1',
      );
      offset += length;
    });
  });
  return out;
}
function zip(entries: Array<[string, Buffer]>) {
  const chunks: Buffer[] = [];
  for (const [name, content] of entries) {
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt32LE(content.length, 18);
    header.writeUInt32LE(content.length, 22);
    header.writeUInt16LE(Buffer.byteLength(name), 26);
    chunks.push(header, Buffer.from(name), content);
  }
  return Buffer.concat(chunks);
}
function fixture() {
  const archive = zip([
    [
      'Localidades.dbf',
      dbf([
        {
          NOMB_UGEP: 'GUANACASTE',
          NOMB_UGEC: 'NICOYA',
          NOMB_UGED: 'NICOYA',
          COD_UGED: '50201',
          NOMB_LOC: 'CURIME',
          DESCR_CAT: 'POBLADO',
        },
        {
          NOMB_UGEP: 'GUANACASTE',
          NOMB_UGEC: 'NICOYA',
          NOMB_UGED: 'NICOYA',
          COD_UGED: '50201',
          NOMB_LOC: 'CURIME',
          DESCR_CAT: 'POBLADO',
        },
        {
          NOMB_UGEP: 'GUANACASTE',
          NOMB_UGEC: 'LIBERIA',
          NOMB_UGED: 'LIBERIA',
          COD_UGED: '50101',
          NOMB_LOC: 'CURIME',
          DESCR_CAT: 'URBANIZACION',
        },
      ]),
    ],
    ['Metadato_Localidades.xml', Buffer.from('<updated>31/12/2024</updated>')],
  ]);
  return {
    archive,
    input: {
      zip: archive,
      sourceUrl: INEC_LOCALIDADES_2024_URL,
      expectedSha256: hash(archive),
      catalogVersion: 'inec-localidades-2024-2024-12-31',
      expectedSourceDate: '2024-12-31',
    },
  };
}

describe('territorial catalog', () => {
  const { input } = fixture();
  it('generates deterministic geometry-free artifact and disambiguates homonyms', () => {
    const first = generateTerritorialCatalog(input);
    const second = generateTerritorialCatalog(input);
    expect(first.artifact).toBe(second.artifact);
    expect(first.manifest.artifactSha256).toBe(second.manifest.artifactSha256);
    expect(first.catalog.provinces).toHaveLength(1);
    expect(
      first.catalog.provinces[0].cantons
        .flatMap((canton) => canton.districts)
        .flatMap((district) => district.localities)
        .filter((locality) => locality.name === 'CURIME'),
    ).toHaveLength(2);
    expect(
      localityKey(input.catalogVersion, '50201', 'CURIME', 'POBLADO'),
    ).not.toBe(
      localityKey(input.catalogVersion, '50101', 'CURIME', 'URBANIZACION'),
    );
    expect(JSON.stringify(first.catalog)).not.toContain('COD_SNIT');
  });
  it('fails closed for archive hash or required schema mismatch', () => {
    expect(() =>
      generateTerritorialCatalog({ ...input, expectedSha256: '0'.repeat(64) }),
    ).toThrow('SHA-256');
    const brokenDbf = dbf([
      {
        NOMB_UGEP: 'X',
        NOMB_UGEC: 'Y',
        NOMB_UGED: 'Z',
        COD_UGED: '10101',
        NOMB_LOC: 'A',
        DESCR_CAT: 'P',
      },
    ]);
    brokenDbf.write('NOT_CATEGORY', 32 + 5 * 32, 'ascii');
    const bad = zip([
      ['Localidades.dbf', brokenDbf],
      ['Metadato_Localidades.xml', Buffer.from('31/12/2024')],
    ]);
    expect(() =>
      generateTerritorialCatalog({
        ...input,
        zip: bad,
        expectedSha256: hash(bad),
      }),
    ).toThrow('Missing required DBF field');
  });
  it('serves read-only hierarchy and validates only full matching selections', () => {
    const output = generateTerritorialCatalog(input);
    const directory = mkdtempSync(join(tmpdir(), 'sgi-catalog-'));
    const path = join(directory, 'catalog.json');
    writeFileSync(path, output.artifact);
    const manifestPath = join(directory, 'manifest.json');
    writeFileSync(
      manifestPath,
      `${JSON.stringify(output.manifest, null, 2)}\n`,
    );
    const previousPath = process.env.TERRITORIAL_CATALOG_PATH;
    const previousManifestPath = process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
    process.env.TERRITORIAL_CATALOG_PATH = path;
    process.env.TERRITORIAL_CATALOG_MANIFEST_PATH = manifestPath;
    const service = new TerritorialCatalogService();
    const controller = new TerritorialCatalogController(service);
    const locality = controller.localities({
      provinceCode: '5',
      cantonCode: '02',
      districtCode: '01',
    }).items[0];
    expect(controller.provinces()).toEqual({
      catalogVersion: input.catalogVersion,
      items: [{ code: '5', name: 'GUANACASTE' }],
    });
    expect(controller.cantons({ provinceCode: '5' }).items).toEqual([
      { code: '01', name: 'LIBERIA' },
      { code: '02', name: 'NICOYA' },
    ]);
    expect(
      controller.validate({
        catalogVersion: input.catalogVersion,
        provinceCode: '5',
        cantonCode: '02',
        districtCode: '01',
        localityKey: locality.localityKey,
      }),
    ).toMatchObject({ locality: { name: 'CURIME', category: 'POBLADO' } });
    expect(() =>
      controller.validate({
        catalogVersion: input.catalogVersion,
        provinceCode: '5',
        cantonCode: '01',
        districtCode: '01',
        localityKey: locality.localityKey,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.validate({
        catalogVersion: 'tampered',
        provinceCode: '5',
        cantonCode: '02',
        districtCode: '01',
        localityKey: locality.localityKey,
      }),
    ).toThrow(BadRequestException);
    rmSync(directory, { recursive: true, force: true });
    if (previousPath === undefined) delete process.env.TERRITORIAL_CATALOG_PATH;
    else process.env.TERRITORIAL_CATALOG_PATH = previousPath;
    if (previousManifestPath === undefined)
      delete process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
    else process.env.TERRITORIAL_CATALOG_MANIFEST_PATH = previousManifestPath;
  });
  it('returns catalog unavailable when the configured artifacts are missing', () => {
    const previousPath = process.env.TERRITORIAL_CATALOG_PATH;
    const previousManifestPath = process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
    process.env.TERRITORIAL_CATALOG_PATH = join(
      tmpdir(),
      'missing-catalog.json',
    );
    process.env.TERRITORIAL_CATALOG_MANIFEST_PATH = join(
      tmpdir(),
      'missing-manifest.json',
    );
    const service = new TerritorialCatalogService();
    expect(() => service.provinces()).toThrow(ServiceUnavailableException);
    if (previousPath !== undefined) process.env.TERRITORIAL_CATALOG_PATH = previousPath;
    if (previousManifestPath !== undefined)
      process.env.TERRITORIAL_CATALOG_MANIFEST_PATH = previousManifestPath;
  });
  it('loads packaged artifacts and serves every read-only hierarchy endpoint', () => {
    expect(existsSync(DEFAULT_TERRITORIAL_CATALOG_PATH)).toBe(true);
    expect(existsSync(DEFAULT_TERRITORIAL_CATALOG_MANIFEST_PATH)).toBe(true);
    const previousPath = process.env.TERRITORIAL_CATALOG_PATH;
    const previousManifestPath = process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
    delete process.env.TERRITORIAL_CATALOG_PATH;
    delete process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
    try {
      const controller = new TerritorialCatalogController(
        new TerritorialCatalogService(),
      );
      const provinces = controller.provinces();
      const province = provinces.items[0];
      const cantons = controller.cantons({ provinceCode: province.code });
      const canton = cantons.items[0];
      const districts = controller.districts({
        provinceCode: province.code,
        cantonCode: canton.code,
      });
      const district = districts.items[0];
      const localities = controller.localities({
        provinceCode: province.code,
        cantonCode: canton.code,
        districtCode: district.code,
      });
      expect(provinces.items.length).toBeGreaterThan(0);
      expect(cantons.items.length).toBeGreaterThan(0);
      expect(districts.items.length).toBeGreaterThan(0);
      expect(localities.items.length).toBeGreaterThan(0);
    } finally {
      if (previousPath === undefined) delete process.env.TERRITORIAL_CATALOG_PATH;
      else process.env.TERRITORIAL_CATALOG_PATH = previousPath;
      if (previousManifestPath === undefined)
        delete process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
      else process.env.TERRITORIAL_CATALOG_MANIFEST_PATH = previousManifestPath;
    }
  });
  it('resolves service from TerritorialCatalogModule without constructor dependencies', async () => {
    const module = await Test.createTestingModule({
      imports: [TerritorialCatalogModule],
    }).compile();
    expect(module.get(TerritorialCatalogService)).toBeInstanceOf(
      TerritorialCatalogService,
    );
    await module.close();
  });
});
