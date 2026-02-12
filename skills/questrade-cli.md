# Skill: questrade-cli

Use the `questrade` CLI to interact with the Questrade brokerage API. This tool provides full access to account data, market data, symbol lookup, order management, and streaming -- all from the command line with JSON output optimized for agent consumption.

## Installation

```bash
npm install -g @agrigoryan/questrade-cli
```

Then run:
```
questrade <command> [flags]
```

Requires Node.js (no Bun needed at runtime).

## Output Behavior

- **stdout**: JSON data (default). Use `--format table` or `--format csv` for human/spreadsheet formats.
- **stderr**: Errors as JSON: `{"error": "message", "code": N}`
- **Exit codes**: 0=success, 1=API error, 2=auth error, 3=usage error

Always parse stdout as JSON. Check exit code for success/failure. Errors are on stderr.

## Authentication

Before any API call, authenticate with a Questrade refresh token:

```bash
questrade auth login --refresh-token <token>
```

For practice/demo accounts:
```bash
questrade auth login --refresh-token <token> --practice
```

Or set environment variables (no login step needed):
```bash
export QUESTRADE_REFRESH_TOKEN="<token>"
export QUESTRADE_PRACTICE=1  # optional, for practice accounts
```

Check auth state:
```bash
questrade auth status
```

Tokens auto-refresh transparently. The CLI stores credentials in `~/.config/questrade-cli/auth.json`. For non-default profiles: `~/.config/questrade-cli/profiles/<name>/auth.json`.

## Account Resolution

Commands that need an account number resolve it automatically:

1. `--account <id>` flag (highest priority)
2. `QUESTRADE_ACCOUNT_ID` env var
3. Auto-detect: fetches account list, uses the one marked `isPrimary`
4. If multiple accounts and no primary: errors with list of available accounts

Recommendation: set `QUESTRADE_ACCOUNT_ID` in your environment for hands-free operation.

## Command Reference

### Server Time
```bash
questrade time
# => {"time": "2024-10-24T12:00:00.000000-04:00"}
```

### Accounts

```bash
# List all accounts (returns account numbers, types, status)
questrade accounts list

# Positions
questrade accounts positions
questrade accounts positions --account 26598145

# Balances (per-currency, combined, start-of-day)
questrade accounts balances

# Orders (with optional filters)
questrade accounts orders
questrade accounts orders --state Open
questrade accounts orders --start 2024-01-01T00:00:00-05:00 --end 2024-01-31T00:00:00-05:00
questrade accounts orders --order-id 12345

# Executions
questrade accounts executions
questrade accounts executions --start 2024-01-01T00:00:00-05:00 --end 2024-01-31T00:00:00-05:00

# Activities (max 31 days per request)
questrade accounts activities --start 2024-01-01T00:00:00-05:00 --end 2024-01-31T00:00:00-05:00
```

### Symbols

```bash
# Search by prefix (returns symbolId, name, description, exchange, currency)
questrade symbols search --prefix AAPL
questrade symbols search --prefix "Bank of" --offset 10

# Get detailed info by ID(s)
questrade symbols get --ids 8049
questrade symbols get --ids 8049,9292,38738

# Get detailed info by name(s)
questrade symbols get --names AAPL,MSFT

# Option chain for an underlying
questrade symbols options --id 8049
```

**Important**: Most commands use Questrade's internal `symbolId` (integer), not ticker strings. Use `symbols search` first to find the ID.

### Market Data

```bash
# List supported markets (TSX, NYSE, NASDAQ, etc.)
questrade markets list

# L1 quotes (by symbolId)
questrade markets quote --ids 8049
questrade markets quote --ids 8049,9292

# Historical candles
questrade markets candles --id 8049 --start 2024-01-01T00:00:00-05:00 --end 2024-01-31T00:00:00-05:00 --interval OneDay
questrade markets candles --id 8049 --start 2024-10-24T09:30:00-04:00 --end 2024-10-24T16:00:00-04:00 --interval FiveMinutes

# Option quotes with Greeks (inline)
questrade markets quote-options --underlying 27426 --expiry 2025-01-17T00:00:00-05:00 --type Call --min-strike 70 --max-strike 80

# Option quotes from file
questrade markets quote-options --body-file /tmp/option-request.json

# Strategy quotes from file
questrade markets quote-strategies --body-file /tmp/strategy-request.json
```

#### Candle Intervals
`OneMinute`, `TwoMinutes`, `ThreeMinutes`, `FourMinutes`, `FiveMinutes`, `TenMinutes`, `FifteenMinutes`, `TwentyMinutes`, `HalfHour`, `OneHour`, `TwoHours`, `FourHours`, `OneDay`, `OneWeek`, `OneMonth`, `OneYear`

### Orders (requires partner/trade scope)

```bash
# Create order from JSON file
questrade orders create --body-file /tmp/order.json

# Update/replace order
questrade orders update --order-id 12345 --body-file /tmp/order-update.json

# Cancel order
questrade orders cancel --order-id 12345

# Preview order impact (commissions, buying power)
questrade orders impact --body-file /tmp/order.json
```

#### Order JSON Structure

```json
{
  "symbolId": 8049,
  "quantity": 100,
  "orderType": "Limit",
  "limitPrice": 150.00,
  "timeInForce": "Day",
  "action": "Buy",
  "primaryRoute": "AUTO",
  "secondaryRoute": "AUTO"
}
```

**OrderType values**: `Market`, `Limit`, `Stop`, `StopLimit`, `TrailStopInPercentage`, `TrailStopInDollar`, `TrailStopLimitInPercentage`, `TrailStopLimitInDollar`, `LimitOnOpen`, `LimitOnClose`

**TimeInForce values**: `Day`, `GoodTillCanceled`, `GoodTillExtendedDay`, `GoodTillDate`, `ImmediateOrCancel`, `FillOrKill`

**Action (OrderSide) values**: `Buy`, `Sell`, `Short`, `Cov`, `BTO`, `STC`, `STO`, `BTC`

### Streaming

```bash
# Stream L1 quotes (JSON lines to stdout, runs until Ctrl+C)
# WARNING: freezes market data in other Questrade IQ platforms
questrade stream quotes --ids 8049,9292

# Stream order/execution notifications
questrade stream notifications
```

Streaming outputs one JSON object per line (JSONL format). Parse each line independently.

## Common Workflows

### Get a quote by ticker symbol

```bash
# Step 1: find the symbolId
questrade symbols search --prefix AAPL
# Parse symbolId from result (e.g., 8049)

# Step 2: get the quote
questrade markets quote --ids 8049
```

### Check portfolio value

```bash
questrade accounts balances
# Look at combinedBalances[].totalEquity
```

### Get open orders

```bash
questrade accounts orders --state Open
```

### Get 1-month daily candles

```bash
questrade markets candles --id 8049 --start 2024-09-01T00:00:00-04:00 --end 2024-10-01T00:00:00-04:00 --interval OneDay
```

### Find option chain and get quotes

```bash
# Get chain (expiry dates, strike prices, call/put symbolIds)
questrade symbols options --id 8049

# Quote specific options using IDs from chain
questrade markets quote-options --underlying 8049 --expiry 2025-01-17T00:00:00-05:00 --type Call --min-strike 140 --max-strike 160
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `QUESTRADE_REFRESH_TOKEN` | Auto-login without `auth login` command |
| `QUESTRADE_ACCOUNT_ID` | Default account (skip `--account` flag) |
| `QUESTRADE_PRACTICE` | `1` = use practice/demo server |
| `QUESTRADE_PROFILE` | Named profile for multi-account setups |

## Rate Limits

The Questrade API enforces rate limits:
- Account calls: 30/sec, 30,000/hour
- Market data calls: 20/sec, 15,000/hour

The CLI auto-retries on HTTP 429 (rate limit exceeded). For heavy usage, add delays between calls.

## Error Handling

Errors are JSON on stderr. The `code` field maps to Questrade error codes:

| Code | Meaning |
|---|---|
| 1001 | Invalid endpoint |
| 1002 | Invalid argument |
| 1004 | Missing required argument |
| 1006 | Rate limit exceeded |
| 1017 | Access token invalid (auto-refreshes) |
| 1018 | Account not found |
| 1019 | Symbol not found |
| 1020 | Order not found |

On exit code 2 (auth error), re-run `questrade auth login --refresh-token <new_token>`.

## Tips for Agents

1. Always use JSON output (the default). Don't pass `--format`.
2. Set `QUESTRADE_REFRESH_TOKEN` and `QUESTRADE_ACCOUNT_ID` env vars so every command is zero-arg where possible.
3. Use `symbols search` to resolve ticker -> symbolId before calling quote/candle endpoints.
4. Pipe output through `jq` for field extraction: `questrade accounts balances | jq '.combinedBalances[0].totalEquity'`
5. All datetime values use ISO 8601 with timezone offset (e.g., `2024-01-15T09:30:00-05:00`).
6. Max 2000 candles per request. For longer ranges, make multiple calls.
7. Activities endpoint supports max 31 days per request.
8. Check the `delay` field in quotes -- if nonzero, data is delayed (user lacks real-time subscription).
