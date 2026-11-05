import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  generateTerritorialCatalog,
  INEC_LOCALIDADES_2024_URL,
} from '../src/territorial-catalog/territorial-catalog.generator';

async function main() {
  const [zipPath, outputPath, manifestPath] = process.argv.slice(2);
  if (!zipPath || !outputPath || !manifestPath)
    throw new Error(
      'Usage: tsx scripts/generate-territorial-catalog.ts <zip> <catalog.json> <manifest.json>',
    );
  if (process.env.INEC_CATALOG_LICENSE_APPROVED !== 'true')
    throw new Error(
      'Refusing artifact publication: INEC_CATALOG_LICENSE_APPROVED=true is required.',
    );
  const sourceUrl =
    process.env.INEC_LOCALIDADES_2024_URL ?? INEC_LOCALIDADES_2024_URL;
  const archiveSha256 =
    process.env.INEC_LOCALIDADES_2024_SHA256 ??
    'dc27c14948e289a1bd0f531e93051609b837ccd9f998cf43ef794e649cb3f9f6';
  const zip = await readFile(zipPath);
  const result = generateTerritorialCatalog({
    zip,
    sourceUrl,
    expectedSha256: archiveSha256,
    catalogVersion: 'inec-localidades-2024-2024-12-31',
    expectedSourceDate: '2024-12-31',
  });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.artifact, 'utf8');
  await writeFile(
    manifestPath,
    `${JSON.stringify(result.manifest, null, 2)}\n`,
    'utf8',
  );
  console.log(
    `catalogSha256=${createHash('sha256').update(result.artifact).digest('hex')}`,
  );
}
void main();
