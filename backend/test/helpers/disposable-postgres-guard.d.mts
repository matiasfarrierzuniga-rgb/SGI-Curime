export interface DisposableTarget {
  value: string;
  host: string;
  port: string;
  database: string;
  username: string;
}
export function validateDisposableEnvironment(
  environment?: NodeJS.ProcessEnv,
): DisposableTarget;
export function processEnvironmentForTest(
  environment?: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv;
