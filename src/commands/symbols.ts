import type { ApiClient } from "@agrigoryan/questrade-api";
import {
  getSymbolsByIds,
  getSymbolsByNames,
  searchSymbols,
  getOptionChain,
} from "@agrigoryan/questrade-api";
import { requireFlag, getFlag, getFlagAsNumber, UsageError } from "../cli/parser.js";
import { output, type OutputFormat } from "../cli/output.js";

export async function handleSymbolsGet(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const idsStr = getFlag(flags, "ids");
  const namesStr = getFlag(flags, "names");

  if (!idsStr && !namesStr) {
    throw new UsageError("Specify --ids <id,...> or --names <name,...>");
  }

  if (idsStr && namesStr) {
    throw new UsageError("Specify either --ids or --names, not both.");
  }

  if (idsStr) {
    const ids = idsStr.split(",").map((s) => {
      const n = Number(s.trim());
      if (Number.isNaN(n)) throw new UsageError(`Invalid symbol ID: ${s}`);
      return n;
    });
    const data = await getSymbolsByIds(client, ids);
    output(data, format);
  } else {
    const names = namesStr!.split(",").map((s) => s.trim());
    const data = await getSymbolsByNames(client, names);
    output(data, format);
  }
}

export async function handleSymbolsSearch(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const prefix = requireFlag(flags, "prefix", "search prefix");
  const offset = getFlagAsNumber(flags, "offset");
  const data = await searchSymbols(client, prefix, offset);
  output(data, format);
}

export async function handleSymbolsOptions(
  client: ApiClient,
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const symbolId = Number(requireFlag(flags, "id", "underlying symbol ID"));
  if (Number.isNaN(symbolId))
    throw new UsageError("--id must be a number");

  const data = await getOptionChain(client, symbolId);
  output(data, format);
}
