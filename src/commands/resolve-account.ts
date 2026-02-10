import type { ApiClient } from "@agrigoryan/questrade-api";
import { getAccounts } from "@agrigoryan/questrade-api";
import { UsageError } from "../cli/parser.js";

/**
 * Resolve account ID from (in priority order):
 * 1. --account flag
 * 2. QUESTRADE_ACCOUNT_ID env var
 * 3. Primary account from API
 */
export async function resolveAccountId(
  client: ApiClient,
  flags: Record<string, string>,
): Promise<string> {
  const fromFlag = flags.account;
  if (fromFlag && fromFlag !== "true") return fromFlag;

  const fromEnv = process.env.QUESTRADE_ACCOUNT_ID;
  if (fromEnv) return fromEnv;

  const { accounts } = await getAccounts(client);

  if (accounts.length === 0) {
    throw new UsageError("No accounts found.");
  }

  if (accounts.length === 1) {
    return accounts[0].number;
  }

  const primary = accounts.find((a) => a.isPrimary);
  if (primary) return primary.number;

  const list = accounts
    .map((a) => `  ${a.number} (${a.type}, ${a.status})`)
    .join("\n");
  throw new UsageError(
    `Multiple accounts found. Specify one with --account or QUESTRADE_ACCOUNT_ID:\n${list}`,
  );
}
