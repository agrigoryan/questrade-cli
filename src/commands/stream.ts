import type { ApiClient } from "@agrigoryan/questrade-api";
import { streamQuotes, streamNotifications } from "@agrigoryan/questrade-api";
import { requireFlag, UsageError } from "../cli/parser.js";

export async function handleStreamQuotes(
  client: ApiClient,
  flags: Record<string, string>,
): Promise<void> {
  const idsStr = requireFlag(flags, "ids", "comma-separated symbol IDs");
  const ids = idsStr.split(",").map((s) => {
    const n = Number(s.trim());
    if (Number.isNaN(n)) throw new UsageError(`Invalid symbol ID: ${s}`);
    return n;
  });

  console.error(
    JSON.stringify({
      warning:
        "L1 streaming will freeze market data in other IQ platforms. Ctrl+C to stop.",
    }),
  );

  const { close } = await streamQuotes(client, ids, {
    onMessage: (data) => console.log(JSON.stringify(data)),
    onError: (err) =>
      console.error(JSON.stringify({ error: err.message })),
  });

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      close();
      resolve();
    });
    process.on("SIGTERM", () => {
      close();
      resolve();
    });
  });
}

export async function handleStreamNotifications(
  client: ApiClient,
): Promise<void> {
  console.error(
    JSON.stringify({
      info: "Streaming order/execution notifications. Ctrl+C to stop.",
    }),
  );

  const { close } = await streamNotifications(client, {
    onMessage: (data) => console.log(JSON.stringify(data)),
    onError: (err) =>
      console.error(JSON.stringify({ error: err.message })),
  });

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      close();
      resolve();
    });
    process.on("SIGTERM", () => {
      close();
      resolve();
    });
  });
}
