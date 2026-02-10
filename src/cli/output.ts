export type OutputFormat = "json" | "table" | "csv";

export function getOutputFormat(flags: Record<string, string>): OutputFormat {
  const f = flags.format ?? flags.f ?? "json";
  if (f === "json" || f === "table" || f === "csv") return f;
  console.error(`Warning: unknown format "${f}", defaulting to json`);
  return "json";
}

/** Print data to stdout in the requested format */
export function output(data: unknown, format: OutputFormat): void {
  switch (format) {
    case "json":
      console.log(JSON.stringify(data, null, 2));
      break;
    case "table":
      printTableSections(data);
      break;
    case "csv":
      printCsvSections(data);
      break;
  }
}

/** Print a structured error to stderr as JSON */
export function outputError(err: {
  error: string;
  code?: number | string;
  httpStatus?: number;
}): void {
  console.error(JSON.stringify(err));
}

function printTableSections(data: unknown): void {
  const sections = toSections(data);
  if (sections.length === 0) {
    console.log("(no data)");
    return;
  }

  for (let s = 0; s < sections.length; s++) {
    const { label, rows } = sections[s];
    if (rows.length === 0) continue;
    if (s > 0) console.log();
    if (label) console.log(`── ${label} ──`);

    const keys = Object.keys(rows[0]);
    const widths = keys.map((k) => k.length);

    for (const row of rows) {
      for (let i = 0; i < keys.length; i++) {
        const val = formatCell(row[keys[i]]);
        widths[i] = Math.max(widths[i], val.length);
      }
    }

    const header = keys.map((k, i) => k.padEnd(widths[i])).join("  ");
    console.log(header);
    console.log(keys.map((_, i) => "─".repeat(widths[i])).join("  "));

    for (const row of rows) {
      const line = keys
        .map((k, i) => formatCell(row[k]).padEnd(widths[i]))
        .join("  ");
      console.log(line);
    }
  }
}

function printCsvSections(data: unknown): void {
  const sections = toSections(data);
  if (sections.length === 0) return;

  for (let s = 0; s < sections.length; s++) {
    const { label, rows } = sections[s];
    if (rows.length === 0) continue;
    if (s > 0) console.log();
    if (label) console.log(`# ${label}`);

    const keys = Object.keys(rows[0]);
    console.log(keys.map(csvEscape).join(","));

    for (const row of rows) {
      console.log(keys.map((k) => csvEscape(formatCell(row[k]))).join(","));
    }
  }
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

interface Section {
  label: string | null;
  rows: Record<string, unknown>[];
}

function toSections(data: unknown): Section[] {
  if (Array.isArray(data)) return [{ label: null, rows: data }];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    const arrayKeys = keys.filter((k) => Array.isArray(obj[k]));

    if (arrayKeys.length === 0) {
      return [{ label: null, rows: [obj] }];
    }
    if (arrayKeys.length === 1) {
      return [{ label: null, rows: obj[arrayKeys[0]] as Record<string, unknown>[] }];
    }
    return arrayKeys.map((key) => ({
      label: key,
      rows: obj[key] as Record<string, unknown>[],
    }));
  }
  return [];
}
