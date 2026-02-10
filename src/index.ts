import { parseArgs, UsageError } from "./cli/parser.js";
import { getOutputFormat, output, outputError } from "./cli/output.js";
import { showHelp, showVersion } from "./cli/help.js";
import { ApiClient, QuestradeError, exchangeRefreshToken, getTime } from "@agrigoryan/questrade-api";
import { loadAuth, saveAuth, isExpired, getProfile, type StoredAuth } from "./config/store.js";

import {
  handleAuthLogin,
  handleAuthCallback,
  handleAuthStatus,
  handleAuthRevoke,
} from "./commands/auth.js";
import {
  handleAccountsList,
  handleAccountsPositions,
  handleAccountsBalances,
  handleAccountsOrders,
  handleAccountsExecutions,
  handleAccountsActivities,
} from "./commands/accounts.js";
import {
  handleMarketsList,
  handleMarketsQuote,
  handleMarketsQuoteOptions,
  handleMarketsQuoteStrategies,
  handleMarketsCandles,
} from "./commands/markets.js";
import {
  handleSymbolsGet,
  handleSymbolsSearch,
  handleSymbolsOptions,
} from "./commands/symbols.js";
import {
  handleOrdersCreate,
  handleOrdersUpdate,
  handleOrdersCancel,
  handleOrdersImpact,
} from "./commands/orders.js";
import {
  handleStreamQuotes,
  handleStreamNotifications,
} from "./commands/stream.js";

class AuthRequiredError extends Error {
  constructor() {
    super("Not authenticated. Run: questrade auth login --refresh-token <token>");
    this.name = "AuthRequiredError";
  }
}

async function resolveAuth(profile: string): Promise<StoredAuth> {
  let stored = loadAuth(profile);

  if (!stored && process.env.QUESTRADE_REFRESH_TOKEN) {
    const practice = process.env.QUESTRADE_PRACTICE === "1" || process.env.QUESTRADE_PRACTICE === "true";
    stored = await refresh(process.env.QUESTRADE_REFRESH_TOKEN, practice, profile);
  }

  if (!stored) throw new AuthRequiredError();

  if (isExpired(stored)) {
    stored = await refresh(stored.refreshToken, stored.practice, profile);
  }

  return stored;
}

async function refresh(refreshToken: string, practice: boolean, profile: string): Promise<StoredAuth> {
  const creds = await exchangeRefreshToken(refreshToken, practice);
  const stored: StoredAuth = {
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken,
    apiServer: creds.apiServer,
    tokenType: creds.tokenType,
    expiresAt: Date.now() + creds.expiresIn * 1000,
    practice,
  };
  saveAuth(stored, profile);
  return stored;
}

async function main() {
  const { commands, flags } = parseArgs(process.argv.slice(2));
  const format = getOutputFormat(flags);

  if (flags.version) {
    showVersion();
    process.exit(0);
  }

  if (flags.help || commands.length === 0) {
    showHelp(commands);
    process.exit(0);
  }

  const [cmd, sub] = commands;

  if (cmd === "auth") {
    switch (sub) {
      case "login":    return handleAuthLogin(flags, format);
      case "callback": return handleAuthCallback(flags, format);
      case "status":   return handleAuthStatus(flags, format);
      case "revoke":   return handleAuthRevoke(flags, format);
      default:
        showHelp(["auth"]);
        process.exit(sub ? 3 : 0);
    }
    return;
  }

  const profile = flags.profile ?? getProfile();
  const stored = await resolveAuth(profile);

  const client = new ApiClient({
    accessToken: stored.accessToken,
    apiServer: stored.apiServer,
    onTokenExpired: async () => {
      const refreshed = await refresh(stored.refreshToken, stored.practice, profile);
      return { accessToken: refreshed.accessToken, apiServer: refreshed.apiServer };
    },
  });

  switch (cmd) {
    case "time":
      output(await getTime(client), format);
      return;

    case "accounts":
      switch (sub) {
        case "list":       return handleAccountsList(client, flags, format);
        case "positions":  return handleAccountsPositions(client, flags, format);
        case "balances":   return handleAccountsBalances(client, flags, format);
        case "orders":     return handleAccountsOrders(client, flags, format);
        case "executions": return handleAccountsExecutions(client, flags, format);
        case "activities": return handleAccountsActivities(client, flags, format);
        default: showHelp(["accounts"]); process.exit(sub ? 3 : 0);
      }
      return;

    case "markets":
      switch (sub) {
        case "list":             return handleMarketsList(client, flags, format);
        case "quote":            return handleMarketsQuote(client, flags, format);
        case "quote-options":    return handleMarketsQuoteOptions(client, flags, format);
        case "quote-strategies": return handleMarketsQuoteStrategies(client, flags, format);
        case "candles":          return handleMarketsCandles(client, flags, format);
        default: showHelp(["markets"]); process.exit(sub ? 3 : 0);
      }
      return;

    case "symbols":
      switch (sub) {
        case "get":     return handleSymbolsGet(client, flags, format);
        case "search":  return handleSymbolsSearch(client, flags, format);
        case "options": return handleSymbolsOptions(client, flags, format);
        default: showHelp(["symbols"]); process.exit(sub ? 3 : 0);
      }
      return;

    case "orders":
      switch (sub) {
        case "create": return handleOrdersCreate(client, flags, format);
        case "update": return handleOrdersUpdate(client, flags, format);
        case "cancel": return handleOrdersCancel(client, flags, format);
        case "impact": return handleOrdersImpact(client, flags, format);
        default: showHelp(["orders"]); process.exit(sub ? 3 : 0);
      }
      return;

    case "stream":
      switch (sub) {
        case "quotes":        return handleStreamQuotes(client, flags);
        case "notifications": return handleStreamNotifications(client);
        default: showHelp(["stream"]); process.exit(sub ? 3 : 0);
      }
      return;

    default:
      showHelp([]);
      process.exit(3);
  }
}

main().catch((err) => {
  if (err instanceof UsageError) {
    outputError({ error: err.message, code: 3 });
    process.exit(3);
  }
  if (err instanceof AuthRequiredError) {
    outputError({ error: err.message, code: 2 });
    process.exit(2);
  }
  if (err instanceof QuestradeError) {
    outputError(err.toJSON());
    process.exit(1);
  }
  outputError({ error: err instanceof Error ? err.message : String(err), code: 1 });
  process.exit(1);
});
