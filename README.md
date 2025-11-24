# Dynamic LP Fees

Dynamic LP Fee Calculator for Stablepool LP fees.

## Overview

This project implements a bot that calculates and manages dynamic liquidity provider fees for stable pools.

## Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (v10.18.1 or higher)

## Installation

```bash
pnpm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
LOG_LEVEL=info
```

Available log levels: `error`, `warn`, `info`, `http`, `debug`

## Usage

### Build the project

```bash
pnpm build
```

### Run the bot

```bash
pnpm start
```

This will build and start the bot loop.

## Development

### Type checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

### Formatting

```bash
# Check formatting
pnpm format:check

# Auto-format code
pnpm format
```

### Testing

```bash
pnpm test
```

## Project Structure

```
dynamic-lp-fees/
├── src/
│   ├── index.ts      # Entry point
│   ├── config.ts     # Configuration
│   ├── logger.ts     # Logging setup
│   └── loop.ts       # Main bot loop
├── tests/            # Test files
└── package.json      # Project dependencies and scripts
```

## License

ISC

