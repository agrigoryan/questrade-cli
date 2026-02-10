import type { ApiClient } from "@agrigoryan/questrade-api";
import {
  getAccounts,
  getPositions,
  getBalances,
  getOrders,
  getExecutions,
  getActivities,
} from "@agrigoryan/questrade-api";
import { resolveAccountId } from "./resolve-account.js";
import { requireFlag, getFlag } from "../cli/parser.js";
import { output, type OutputFormat } from "../cli/output.js";

export async function handleAccountsList(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const data = await getAccounts(client);
  output(data, format);
}

export async function handleAccountsPositions(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const data = await getPositions(client, accountId);
  output(data, format);
}

export async function handleAccountsBalances(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const data = await getBalances(client, accountId);
  output(data, format);
}

export async function handleAccountsOrders(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const data = await getOrders(client, accountId, {
    startTime: getFlag(flags, "start"),
    endTime: getFlag(flags, "end"),
    stateFilter: getFlag(flags, "state"),
    orderId: getFlag(flags, "order-id"),
  });
  output(data, format);
}

export async function handleAccountsExecutions(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const data = await getExecutions(
    client,
    accountId,
    getFlag(flags, "start"),
    getFlag(flags, "end"),
  );
  output(data, format);
}

export async function handleAccountsActivities(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const startTime = requireFlag(flags, "start", "ISO date start");
  const endTime = requireFlag(flags, "end", "ISO date end");
  const data = await getActivities(client, accountId, startTime, endTime);
  output(data, format);
}
