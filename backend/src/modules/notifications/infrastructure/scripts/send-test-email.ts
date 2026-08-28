import 'dotenv/config';
import {
  runManualEmailTest,
  sanitizeManualEmailError,
} from '../manual-email-test';

const logger = {
  info(message: string): void {
    process.stdout.write(`${message}\n`);
  },
};

runManualEmailTest({
  recipient: process.argv[2],
  environment: process.env,
  logger,
}).catch((error: unknown) => {
  process.stderr.write(`${sanitizeManualEmailError(error)}\n`);
  process.exitCode = 1;
});
