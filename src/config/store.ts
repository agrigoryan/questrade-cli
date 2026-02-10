import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  apiServer: string;
  tokenType: string;
  expiresAt: number; // unix ms
  practice: boolean;
}

function configDir(profile: string): string {
  const base = join(homedir(), ".config", "questrade-cli");
  return profile === "default" ? base : join(base, "profiles", profile);
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

function authPath(profile: string): string {
  return join(configDir(profile), "auth.json");
}

export function loadAuth(profile = "default"): StoredAuth | null {
  const p = authPath(profile);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth, profile = "default"): void {
  const dir = configDir(profile);
  ensureDir(dir);
  writeFileSync(authPath(profile), JSON.stringify(auth, null, 2), { mode: 0o600 });
}

export function deleteAuth(profile = "default"): void {
  const p = authPath(profile);
  if (existsSync(p)) unlinkSync(p);
}

export function isExpired(auth: StoredAuth): boolean {
  return Date.now() >= auth.expiresAt - 30_000;
}

export function getProfile(): string {
  return process.env.QUESTRADE_PROFILE || "default";
}
