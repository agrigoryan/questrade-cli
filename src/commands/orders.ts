import { readFileSync } from "fs";
import type { ApiClient } from "@agrigoryan/questrade-api";
import {
  createOrder,
  updateOrder,
  cancelOrder,
  getOrderImpact,
} from "@agrigoryan/questrade-api";
import { resolveAccountId } from "./resolve-account.js";
import { requireFlag, UsageError } from "../cli/parser.js";
import { output, type OutputFormat } from "../cli/output.js";

function readBodyFile(flags: Record<string, string>): unknown {
  const bodyFile = requireFlag(flags, "body-file", "path to order JSON file");
  try {
    return JSON.parse(readFileSync(bodyFile, "utf-8"));
  } catch (err) {
    throw new UsageError(`Failed to read --body-file: ${err}`);
  }
}

export async function handleOrdersCreate(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const body = readBodyFile(flags);
  const data = await createOrder(client, accountId, body as any);
  output(data, format);
}

export async function handleOrdersUpdate(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const orderId = Number(requireFlag(flags, "order-id", "order ID to update"));
  if (Number.isNaN(orderId))
    throw new UsageError("--order-id must be a number");

  const body = readBodyFile(flags);
  const data = await updateOrder(client, accountId, orderId, body as any);
  output(data, format);
}

export async function handleOrdersCancel(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const orderId = Number(requireFlag(flags, "order-id", "order ID to cancel"));
  if (Number.isNaN(orderId))
    throw new UsageError("--order-id must be a number");

  await cancelOrder(client, accountId, orderId);
  output({ status: "cancelled", orderId }, format);
}

export async function handleOrdersImpact(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const accountId = await resolveAccountId(client, flags);
  const body = readBodyFile(flags);
  const data = await getOrderImpact(client, accountId, body as any);
  output(data, format);
}
