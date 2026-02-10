# questrade-cli

CLI for the [Questrade API](https://www.questrade.com/api/documentation). JSON-first output, agent-friendly. Built on [`@agrigoryan/questrade-api`](https://github.com/agrigoryan/questrade-api).

## Features

- Full Questrade v1 API coverage (accounts, markets, symbols, orders)
- Real-time L1 quote and notification streaming via WebSocket (JSONL)
- OAuth2 authentication with automatic token refresh
- JSON output by default, table/CSV via `--format`
- Auto-resolves account ID from flag, env var, or primary account
- Named profiles for multi-account setups

## Install

```sh
bun add -g @agrigoryan/questrade-cli
# or
npm install -g @agrigoryan/questrade-cli
```

## Quick Start

```bash
# Authenticate with a refresh token from Questrade API Hub
questrade auth login --refresh-token <token>

# List accounts
questrade accounts list

# Get positions
questrade accounts positions

# Search for a symbol
questrade symbols search --prefix AAPL

# Get a quote
questrade markets quote --ids 8049
```

Or skip the login step with environment variables:

```bash
export QUESTRADE_REFRESH_TOKEN="<token>"
export QUESTRADE_ACCOUNT_ID="<account_number>"

questrade accounts balances
```

## Authentication

Questrade uses OAuth2. Get a refresh token from the [Questrade API Hub](https://www.questrade.com/api).

### Refresh Token Flow

```bash
questrade auth login --refresh-token <token>
```

### Authorization Code Flow (partner apps)

```bash
questrade auth callback --code <code> --client-id <id> --redirect-uri <uri>
```

### Practice (Demo) Account

```bash
questrade auth login --refresh-token <token> --practice
```

### Check Status / Revoke

```bash
questrade auth status
questrade auth revoke
```

Credentials are stored in `~/.config/questrade-cli/auth.json`. For named profiles: `~/.config/questrade-cli/profiles/<name>/auth.json`.

## Account Resolution

Commands that need an account number resolve it automatically:

1. `--account <id>` flag (highest priority)
2. `QUESTRADE_ACCOUNT_ID` env var
3. Primary account from API
4. If ambiguous: errors with available account list

## Commands

### Server Time

```bash
questrade time
```

### Accounts

```bash
questrade accounts list
questrade accounts positions [--account <id>]
questrade accounts balances [--account <id>]
questrade accounts orders [--account <id>] [--start <iso>] [--end <iso>] [--state All|Open|Closed] [--order-id <id>]
questrade accounts executions [--account <id>] [--start <iso>] [--end <iso>]
questrade accounts activities [--account <id>] --start <iso> --end <iso>
```

### Symbols

```bash
questrade symbols search --prefix AAPL [--offset <n>]
questrade symbols get --ids 8049,9292
questrade symbols get --names AAPL,MSFT
questrade symbols options --id 8049
```

### Market Data

```bash
questrade markets list
questrade markets quote --ids 8049,9292
questrade markets candles --id 8049 --start <iso> --end <iso> --interval OneDay
questrade markets quote-options --body-file <path>
questrade markets quote-options --underlying <id> --expiry <date> [--type Call|Put] [--min-strike N] [--max-strike N]
questrade markets quote-strategies --body-file <path>
```

#### Candle Intervals

`OneMinute`, `TwoMinutes`, `ThreeMinutes`, `FourMinutes`, `FiveMinutes`, `TenMinutes`, `FifteenMinutes`, `TwentyMinutes`, `HalfHour`, `OneHour`, `TwoHours`, `FourHours`, `OneDay`, `OneWeek`, `OneMonth`, `OneYear`

### Orders

Requires partner/trade scope.

```bash
questrade orders create [--account <id>] --body-file <path>
questrade orders update [--account <id>] --order-id <id> --body-file <path>
questrade orders cancel [--account <id>] --order-id <id>
questrade orders impact [--account <id>] --body-file <path>
```

### Streaming

```bash
questrade stream quotes --ids 8049,9292
questrade stream notifications
```

Streams output one JSON object per line (JSONL). Runs until interrupted.

> **Warning:** Streaming quotes freezes market data in other Questrade IQ platforms.

## Global Flags

| Flag | Description |
|---|---|
| `--format <json\|table\|csv>` | Output format (default: json) |
| `--profile <name>` | Config profile (default: "default") |
| `--account <id>` | Account number |
| `--help` | Show help |
| `--version` | Show version |

## Environment Variables

| Variable | Purpose |
|---|---|
| `QUESTRADE_REFRESH_TOKEN` | Auto-login without `auth login` |
| `QUESTRADE_ACCOUNT_ID` | Default account for account-scoped commands |
| `QUESTRADE_PRACTICE` | `1` = use practice/demo server |
| `QUESTRADE_PROFILE` | Same as `--profile` |

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | API error |
| 2 | Auth error |
| 3 | Usage error |

## Development

```sh
bun install
bun run dev                # run from source
bun run typecheck          # type-check only
bun run build              # bundle to dist/
```

## License

MIT
