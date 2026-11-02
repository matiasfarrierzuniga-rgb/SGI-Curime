export const TERRITORIAL_CATALOG_SCHEMA_VERSION = 1;

export type CatalogLocality = {
  localityKey: string;
  name: string;
  category: string;
};

export type CatalogDistrict = {
  code: string;
  name: string;
  localities: CatalogLocality[];
};
export type CatalogCanton = {
  code: string;
  name: string;
  districts: CatalogDistrict[];
};
export type CatalogProvince = {
  code: string;
  name: string;
  cantons: CatalogCanton[];
};

export type TerritorialCatalog = {
  schemaVersion: number;
  catalogVersion: string;
  source: {
    title: string;
    url: string;
    sourceDate: string;
    archiveSha256: string;
  };
  provinces: CatalogProvince[];
};

export type TerritorialCatalogManifest = {
  generatorSchemaVersion: number;
  catalogVersion: string;
  source: {
    title: string;
    url: string;
    sourceDate: string;
    archiveSha256: string;
  };
  artifactSha256: string;
};
