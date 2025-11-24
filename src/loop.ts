import { getLogger } from './logger';

export async function runBotLoop(): Promise<void> {
  while (true) {
    getLogger().info('Hello');
    await new Promise((resolve) => setTimeout(resolve, 10_000)); // 10 seconds
  }
}
