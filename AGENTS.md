# AGENTS.md

## Project

CLI for the Questrade REST + WebSocket API. JSON-first output, agent-friendly. Built on `@agrigoryan/questrade-api`.

## Stack

- **Language:** TypeScript 5.7+ (strict)
- **Runtime:** Bun
- **Package manager:** Bun
- **Module system:** ESM (`"type": "module"`)
- **Dependencies:** `@agrigoryan/questrade-api` (sole runtime dep)

## Commands

| Command | Purpose |
|---|---|
| `bun run build` | Bundle to `dist/` via `bun build` (Bun target) |
| `bun run dev` | Run from source (`bun run src/index.ts`) |
| `bun run typecheck` | Type-check only (`tsc --noEmit`) |

No tests, linting, or CI configured yet.

## Architecture

Thin CLI layer over `@agrigoryan/questrade-api`. Parses args, dispatches to command handlers, formats output.

```
bin/
  questrade              # Entrypoint (shebang script)
src/
  index.ts               # Arg parsing, auth bootstrap, command dispatch
  cli/
    parser.ts            # CLI argument parsing (flags, positionals)
    help.ts              # Help text / usage for all commands
    output.ts            # Output formatting (JSON, table, CSV)
  commands/
    auth.ts              # login, callback, status, revoke
    accounts.ts          # list, positions, balances, orders, executions, activities
    resolve-account.ts   # Auto-resolve account ID (flag > env > primary)
    symbols.ts           # get, search, option chains
    markets.ts           # list, quote, candles, option/strategy quotes
    orders.ts            # create, update, cancel, impact
    stream.ts            # WebSocket quote + notification streams
  config/
    store.ts             # Credential persistence (~/.config/questrade-cli/)
```

## Key Patterns

- **Auth:** Delegates to `@agrigoryan/questrade-api` for OAuth2 token exchange. Stores credentials in `~/.config/questrade-cli/auth.json` (or per-profile subdirectory).
- **Auto-login:** If `QUESTRADE_REFRESH_TOKEN` env var is set, authenticates on-the-fly without explicit `auth login`.
- **Account resolution:** `--account` flag > `QUESTRADE_ACCOUNT_ID` env > primary account from API.
- **Output:** JSON to stdout (default), table/CSV via `--format`. Errors as JSON to stderr.
- **Exit codes:** 0=success, 1=API error, 2=auth error, 3=usage error.
- **Streaming:** WebSocket streams emit JSONL (one JSON object per line) to stdout.

## Conventions

- Commits: Conventional Commits (`feat`, `fix`, `refactor`, etc.)
- Keep files under 700 LOC.
- No `.env` handling -- credentials via env vars or `auth login`.
