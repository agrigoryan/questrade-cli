const VERSION = "0.1.0";

const MAIN_HELP = `questrade-cli v${VERSION}
CLI for the Questrade API. Agent-friendly, JSON-first output.

USAGE
  questrade <command> <subcommand> [flags]
  qt <command> <subcommand> [flags]          (alias)

COMMANDS
  auth          Authentication (login, status, revoke)
  time          Server time
  accounts      Account data (list, positions, balances, orders, executions, activities)
  markets       Market data (list, quotes, candles)
  symbols       Symbol lookup (get, search, options chain)
  orders        Order management (create, update, cancel, impact)
  stream        Streaming (quotes, notifications)

GLOBAL FLAGS
  --format <json|table|csv>   Output format (default: json)
  --profile <name>            Config profile (default: "default")
  --account <id>              Account number (or set QUESTRADE_ACCOUNT_ID)
  --help                      Show help
  --version                   Show version

ENVIRONMENT VARIABLES
  QUESTRADE_REFRESH_TOKEN     Bootstrap auth without 'auth login'
  QUESTRADE_ACCOUNT_ID        Default account for account-scoped commands
  QUESTRADE_PRACTICE          Set to "1" for practice server
  QUESTRADE_PROFILE           Same as --profile

EXIT CODES
  0  Success
  1  API error
  2  Auth error
  3  Usage error
`;

const HELP_MAP: Record<string, string> = {
  "": MAIN_HELP,

  auth: `questrade auth - Authentication

COMMANDS
  questrade auth login --refresh-token <token> [--practice]
    Exchange refresh token for access. Stores credentials locally.

  questrade auth callback --code <code> --client-id <id> --redirect-uri <uri> [--practice]
    Exchange authorization code (for partner/OAuth apps).

  questrade auth status
    Show current authentication state.

  questrade auth revoke
    Revoke the current refresh token and delete local credentials.
`,

  time: `questrade time - Server time

USAGE
  questrade time

Returns the Questrade server time as ISO 8601 string.
`,

  accounts: `questrade accounts - Account data

COMMANDS
  questrade accounts list
    List all accounts.

  questrade accounts positions [--account <id>]
    Get positions for an account.

  questrade accounts balances [--account <id>]
    Get balances for an account.

  questrade accounts orders [--account <id>] [--start <iso>] [--end <iso>] [--state <All|Open|Closed>] [--order-id <id>]
    Get orders for an account. Filters by date range and/or state.

  questrade accounts executions [--account <id>] [--start <iso>] [--end <iso>]
    Get executions for an account.

  questrade accounts activities [--account <id>] --start <iso> --end <iso>
    Get account activities (max 31 days per request).
`,

  markets: `questrade markets - Market data

COMMANDS
  questrade markets list
    List supported markets.

  questrade markets quote --ids <id,...>
    Get L1 quotes for one or more symbol IDs (comma-separated).

  questrade markets quote-options --body-file <path>
    Get option quotes with Greeks. Reads OptionQuotesRequest JSON from file.
    Inline: --underlying <id> --expiry <date> [--type Call|Put] [--min-strike N] [--max-strike N]

  questrade markets quote-strategies --body-file <path>
    Get multi-leg strategy quotes. Reads StrategyQuotesRequest JSON from file.

  questrade markets candles --id <symbolId> --start <iso> --end <iso> --interval <granularity>
    Get OHLC candles. Max 2000 per request.
    Intervals: OneMinute, FiveMinutes, FifteenMinutes, OneHour, OneDay, OneWeek, OneMonth, etc.
`,

  symbols: `questrade symbols - Symbol lookup

COMMANDS
  questrade symbols get --ids <id,...>
    Get detailed symbol info by IDs (comma-separated).

  questrade symbols get --names <name,...>
    Get detailed symbol info by names (comma-separated).

  questrade symbols search --prefix <str> [--offset <n>]
    Search symbols by prefix.

  questrade symbols options --id <symbolId>
    Get option chain for an underlying symbol.
`,

  orders: `questrade orders - Order management (partner scope required)

COMMANDS
  questrade orders create [--account <id>] --body-file <path>
    Create an order. Reads OrderRequest JSON from file.

  questrade orders update [--account <id>] --order-id <id> --body-file <path>
    Update/replace an existing order.

  questrade orders cancel [--account <id>] --order-id <id>
    Cancel an order.

  questrade orders impact [--account <id>] --body-file <path>
    Preview order impact (estimated commissions, buying power effect).
`,

  stream: `questrade stream - Streaming data

COMMANDS
  questrade stream quotes --ids <id,...>
    Stream L1 quotes via WebSocket. Outputs JSON lines to stdout.
    WARNING: Streaming freezes market data in other IQ platforms.

  questrade stream notifications
    Stream order/execution notifications via WebSocket.
    Outputs JSON lines to stdout.
`,
};

export function showHelp(commandPath: string[]): void {
  const key = commandPath.join(" ");
  const text = HELP_MAP[key] ?? HELP_MAP[commandPath[0]] ?? HELP_MAP[""];
  console.log(text);
}

export function showVersion(): void {
  console.log(VERSION);
}
