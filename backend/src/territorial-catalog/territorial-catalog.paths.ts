import { resolve } from 'node:path';

const dataDirectory = resolve(process.cwd(), 'data', 'territorial');

export const DEFAULT_TERRITORIAL_CATALOG_PATH = resolve(
  dataDirectory,
  'catalog.inec-2024.json',
);
export const DEFAULT_TERRITORIAL_CATALOG_MANIFEST_PATH = resolve(
  dataDirectory,
  'manifest.inec-2024.json',
);

export function territorialCatalogPath(): string {
  return (
    process.env.TERRITORIAL_CATALOG_PATH?.trim() ||
    DEFAULT_TERRITORIAL_CATALOG_PATH
  );
}

export function territorialCatalogManifestPath(): string {
  return (
    process.env.TERRITORIAL_CATALOG_MANIFEST_PATH?.trim() ||
    DEFAULT_TERRITORIAL_CATALOG_MANIFEST_PATH
  );
}
