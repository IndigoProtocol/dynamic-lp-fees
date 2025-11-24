import winston from 'winston';
import { ALL_LOG_LEVELS } from './config';
import path from 'path';

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define custom format
const defaultFormat = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // Define format of the message showing the timestamp, the level and the message
  winston.format.printf(
    (info) =>
      `[${info.timestamp as string}] ${info.level}: ${info.message as string} ${
        info.meta ? JSON.stringify(info.meta) : ''
      }`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      defaultFormat,
      // Add colors
      winston.format.colorize({ all: true }),
    ),
  }),
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: defaultFormat,
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: defaultFormat,
  }),
];

let _logger: winston.Logger | null = null;

export const getLogger = () => {
  if (!_logger) {
    throw new Error('Logger not initialized');
  }

  return _logger;
};

export function initLogger(level: string) {
  if (_logger) {
    throw new Error('Logger already initialised.');
  }

  if (!(level in ALL_LOG_LEVELS)) {
    throw new Error(
      `"${level}" not any of the available levels: ${JSON.stringify(Object.keys(ALL_LOG_LEVELS))}`,
    );
  }

  _logger = winston.createLogger({
    level: level,
    levels: ALL_LOG_LEVELS,
    format: defaultFormat,
    transports,
  });
}
