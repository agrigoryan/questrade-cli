import { readFileSync } from "fs";
import type { ApiClient, OptionQuotesRequest } from "@agrigoryan/questrade-api";
import {
  getMarkets,
  getQuotes,
  getOptionQuotes,
  getStrategyQuotes,
  getCandles,
} from "@agrigoryan/questrade-api";
import { requireFlag, getFlag, UsageError } from "../cli/parser.js";
import { output, type OutputFormat } from "../cli/output.js";

export async function handleMarketsList(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const data = await getMarkets(client);
  output(data, format);
}

export async function handleMarketsQuote(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const idsStr = requireFlag(flags, "ids", "comma-separated symbol IDs");
  const ids = idsStr.split(",").map((s) => {
    const n = Number(s.trim());
    if (Number.isNaN(n)) throw new UsageError(`Invalid symbol ID: ${s}`);
    return n;
  });
  const data = await getQuotes(client, ids);
  output(data, format);
}

export async function handleMarketsQuoteOptions(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  let request: OptionQuotesRequest;

  const bodyFile = getFlag(flags, "body-file");
  if (bodyFile) {
    try {
      request = JSON.parse(readFileSync(bodyFile, "utf-8"));
    } catch (e) {
      throw new UsageError(`Failed to parse ${bodyFile}: ${(e as Error).message}`);
    }
  } else {
    const underlyingId = Number(
      requireFlag(flags, "underlying", "underlying symbol ID"),
    );
    const expiryDate = requireFlag(flags, "expiry", "expiry date ISO");

    const filter: Record<string, unknown> = { underlyingId, expiryDate };
    const optionType = getFlag(flags, "type");
    if (optionType) filter.optionType = optionType;

    const minStrike = getFlag(flags, "min-strike");
    if (minStrike) filter.minstrikePrice = Number(minStrike);

    const maxStrike = getFlag(flags, "max-strike");
    if (maxStrike) filter.maxstrikePrice = Number(maxStrike);

    request = { filters: [filter as any] };
  }

  const data = await getOptionQuotes(client, request);
  output(data, format);
}

export async function handleMarketsQuoteStrategies(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const bodyFile = requireFlag(
    flags,
    "body-file",
    "path to StrategyQuotesRequest JSON",
  );
  let request;
  try {
    request = JSON.parse(readFileSync(bodyFile, "utf-8"));
  } catch (e) {
    throw new UsageError(`Failed to parse ${bodyFile}: ${(e as Error).message}`);
  }
  const data = await getStrategyQuotes(client, request);
  output(data, format);
}

export async function handleMarketsCandles(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const symbolId = Number(requireFlag(flags, "id", "symbol ID"));
  if (Number.isNaN(symbolId))
    throw new UsageError("--id must be a number");

  const startTime = requireFlag(flags, "start", "ISO start time");
  const endTime = requireFlag(flags, "end", "ISO end time");
  const interval = requireFlag(
    flags,
    "interval",
    "granularity (e.g. OneDay, FiveMinutes)",
  );

  const data = await getCandles(client, symbolId, startTime, endTime, interval);
  output(data, format);
}
