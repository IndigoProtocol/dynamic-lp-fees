import { Network } from '@lucid-evolution/lucid';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define the configuration interface
export interface Config {
  // Node environment
  NODE_ENV: string;

  // Blockchain configuration
  NETWORK: Network;

  // Logging configuration
  LOG_LEVEL: string;

  // Admin configuration
  SEED_PHRASE: string;
  ACCOUNT_INDEX: number;

  // Ogmios and Kupo configuration
  OGMIOS_HOST: string;
  OGMIOS_PORT: number;
  OGMIOS_TLS: boolean;

  KUPO_HOST: string;
  KUPO_PORT: number;
  KUPO_TLS: boolean;

  INDIGO_ANALYTICS_API_HOST: string;
  INDIGO_ANALYTICS_API_PORT: number;
  INDIGO_ANALYTICS_API_TLS: boolean;

  MINSWAP_POOL_ID: string;
  INDIGO_ASSET_NAME: string;
}

// Create and validate configuration object
export const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NETWORK: (process.env.NETWORK as Network) || 'Preview',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  SEED_PHRASE: process.env.SEED_PHRASE || '',
  ACCOUNT_INDEX: parseInt(process.env.ACCOUNT_INDEX || '0', 10),

  OGMIOS_HOST: process.env.OGMIOS_HOST || 'localhost',
  OGMIOS_PORT: parseInt(process.env.OGMIOS_PORT || '1337', 10),
  OGMIOS_TLS: process.env.OGMIOS_TLS === 'true',

  KUPO_HOST: process.env.KUPO_HOST || 'localhost',
  KUPO_PORT: parseInt(process.env.KUPO_PORT || '1338', 10),
  KUPO_TLS: process.env.KUPO_TLS === 'true',

  INDIGO_ANALYTICS_API_HOST: process.env.INDIGO_ANALYTICS_API_HOST || 'localhost',
  INDIGO_ANALYTICS_API_PORT: parseInt(process.env.INDIGO_ANALYTICS_API_PORT || '1339', 10),
  INDIGO_ANALYTICS_API_TLS: process.env.INDIGO_ANALYTICS_API_TLS === 'true',

  MINSWAP_POOL_ID: process.env.MINSWAP_POOL_ID || '',
  INDIGO_ASSET_NAME: process.env.INDIGO_ASSET_NAME || '',
};

// Validate required configuration
export function validateConfig(): void {
  // Validate NETWORK is valid
  if (!['Mainnet', 'Preview', 'Preprod', 'Custom'].includes(config.NETWORK)) {
    throw new Error(`Invalid NETWORK configuration: ${config.NETWORK}`);
  }

  // Validate Ogmios configuration
  if (!config.OGMIOS_HOST) {
    throw new Error('Missing required configuration: OGMIOS_HOST');
  }
  if (!config.OGMIOS_PORT) {
    throw new Error('Missing required configuration: OGMIOS_PORT');
  }

  // Validate Kupo configuration
  if (!config.KUPO_HOST) {
    throw new Error('Missing required configuration: KUPO_HOST');
  }
  if (!config.KUPO_PORT) {
    throw new Error('Missing required configuration: KUPO_PORT');
  }

  // Validate INDIGO_ANALYTICS_API
  if (!config.INDIGO_ANALYTICS_API_HOST) {
    throw new Error('Missing required configuration: INDIGO_ANALYTICS_API_HOST');
  }
  if (!config.INDIGO_ANALYTICS_API_PORT) {
    throw new Error('Missing required configuration: INDIGO_ANALYTICS_API_PORT');
  }
  if (!config.INDIGO_ANALYTICS_API_TLS) {
    throw new Error('Missing required configuration: INDIGO_ANALYTICS_API_TLS');
  }

  // Validate SEED_PHRASE has 24 words
  if (!config.SEED_PHRASE) {
    throw new Error('Missing required configuration: SEED_PHRASE');
  }

  // Validate MINSWAP_POOL_ID
  if (!config.MINSWAP_POOL_ID) {
    throw new Error('Missing required configuration: MINSWAP_POOL_ID');
  }

  // Validate INDIGO_ASSET_NAME
  if (!config.INDIGO_ASSET_NAME) {
    throw new Error('Missing required configuration: INDIGO_ASSET_NAME');
  }

  const wordCount = config.SEED_PHRASE.trim().split(/\s+/).length;
  if (wordCount !== 24) {
    throw new Error(
      `SEED_PHRASE must contain exactly 24 words, found ${wordCount} words`,
    );
  }
}

export const ALL_LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Export default config
export default config;