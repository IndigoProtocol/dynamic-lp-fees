import path from 'path';
import { getLogger, initLogger } from './logger';
import { runBotLoop } from './loop';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

initLogger(process.env.LOG_LEVEL!);

getLogger().info('Bot starting up...');

runBotLoop().catch((error: Error) => {
  getLogger().error(`Error during bot: ${error}`);
  getLogger().error(`Stack trace: ${error.stack}`);
  process.exit(1);
});
