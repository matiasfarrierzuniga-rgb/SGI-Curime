import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type {
  TerritorialCatalog,
  TerritorialCatalogManifest,
} from './territorial-catalog.types';

type Selection = {
  catalogVersion: string;
  provinceCode: string;
  cantonCode: string;
  districtCode: string;
  localityKey: string;
};
const unavailable = () =>
  new ServiceUnavailableException({
    code: 'CATALOG_UNAVAILABLE',
    message: 'Catálogo territorial no disponible.',
  });

@Injectable()
export class TerritorialCatalogService {
  private readonly catalog?: TerritorialCatalog;
  constructor() {
    const path = process.env.TERRITORIAL_CATALOG_PATH;
    const manifestPath = process.env.TERRITORIAL_CATALOG_MANIFEST_PATH;
    if (!path || !manifestPath) return;
    try {
      const artifact = readFileSync(path, 'utf8');
      const candidate = JSON.parse(artifact) as TerritorialCatalog;
      const manifest = JSON.parse(
        readFileSync(manifestPath, 'utf8'),
      ) as TerritorialCatalogManifest;
      const hash = createHash('sha256').update(artifact).digest('hex');
      if (
        !candidate.catalogVersion ||
        manifest.catalogVersion !== candidate.catalogVersion ||
        manifest.artifactSha256 !== hash
      )
        return;
      this.catalog = candidate;
    } catch {
      /* Configuration errors deliberately fail closed. */
    }
  }
  private getCatalog() {
    if (!this.catalog) throw unavailable();
    return this.catalog;
  }
  private version() {
    return this.getCatalog().catalogVersion;
  }
  provinces() {
    const catalog = this.getCatalog();
    return {
      catalogVersion: catalog.catalogVersion,
      items: catalog.provinces.map(({ code, name }) => ({ code, name })),
    };
  }
  cantons(provinceCode: string) {
    const province = this.getCatalog().provinces.find(
      (item) => item.code === provinceCode,
    );
    if (!province) throw new BadRequestException('Provincia inválida.');
    return {
      catalogVersion: this.version(),
      items: province.cantons.map(({ code, name }) => ({ code, name })),
    };
  }
  districts(provinceCode: string, cantonCode: string) {
    const province = this.getCatalog().provinces.find(
      (item) => item.code === provinceCode,
    );
    const canton = province?.cantons.find((item) => item.code === cantonCode);
    if (!canton) throw new BadRequestException('Ruta territorial inválida.');
    return {
      catalogVersion: this.version(),
      items: canton.districts.map(({ code, name }) => ({ code, name })),
    };
  }
  localities(provinceCode: string, cantonCode: string, districtCode: string) {
    const province = this.getCatalog().provinces.find(
      (item) => item.code === provinceCode,
    );
    const district = province?.cantons
      .find((item) => item.code === cantonCode)
      ?.districts.find((item) => item.code === districtCode);
    if (!district) throw new BadRequestException('Ruta territorial inválida.');
    return { catalogVersion: this.version(), items: district.localities };
  }
  validate(selection: Selection) {
    const catalog = this.getCatalog();
    if (selection.catalogVersion !== catalog.catalogVersion)
      throw new BadRequestException('Versión de catálogo no compatible.');
    const province = catalog.provinces.find(
      (item) => item.code === selection.provinceCode,
    );
    const canton = province?.cantons.find(
      (item) => item.code === selection.cantonCode,
    );
    const district = canton?.districts.find(
      (item) => item.code === selection.districtCode,
    );
    const locality = district?.localities.find(
      (item) => item.localityKey === selection.localityKey,
    );
    if (!province || !canton || !district || !locality)
      throw new BadRequestException('Selección territorial inválida.');
    return {
      catalogVersion: catalog.catalogVersion,
      source: catalog.source,
      province: { code: province.code, name: province.name },
      canton: { code: canton.code, name: canton.name },
      district: { code: district.code, name: district.name },
      locality,
    };
  }
}
