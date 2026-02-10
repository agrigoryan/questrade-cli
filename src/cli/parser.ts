export interface ParsedArgs {
  /** Command path segments, e.g. ["accounts", "list"] */
  commands: string[];
  /** Named flags: --foo bar => { foo: "bar" }, --bool-flag => { "bool-flag": "true" } */
  flags: Record<string, string>;
}

/**
 * Minimal argv parser. No dependencies.
 *
 * Supports:
 *   --flag value
 *   --flag=value
 *   --bool-flag (value = "true")
 *   Positional args before first -- flag are command path segments
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const commands: string[] = [];
  const flags: Record<string, string> = {};

  let i = 0;

  while (i < argv.length && !argv[i].startsWith("-")) {
    commands.push(argv[i]);
    i++;
  }

  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        flags[key] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
          flags[key] = argv[i + 1];
          i++;
        } else {
          flags[key] = "true";
        }
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const key = arg.slice(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        flags[key] = argv[i + 1];
        i++;
      } else {
        flags[key] = "true";
      }
    } else {
      commands.push(arg);
    }

    i++;
  }

  return { commands, flags };
}

/** Get a required flag or throw with usage hint */
export function requireFlag(
  flags: Record<string, string>,
  name: string,
  description?: string,
): string {
  const value = flags[name];
  if (value === undefined || value === "true") {
    const hint = description ? ` (${description})` : "";
    throw new UsageError(`Missing required flag: --${name}${hint}`);
  }
  return value;
}

/** Get an optional flag value */
export function getFlag(
  flags: Record<string, string>,
  name: string,
  defaultValue?: string,
): string | undefined {
  const value = flags[name];
  if (value === undefined) return defaultValue;
  return value;
}

/** Get a flag as a number */
export function getFlagAsNumber(
  flags: Record<string, string>,
  name: string,
): number | undefined {
  const v = flags[name];
  if (v === undefined) return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) {
    throw new UsageError(`Flag --${name} must be a number, got: ${v}`);
  }
  return n;
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
