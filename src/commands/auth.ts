import { exchangeRefreshToken, exchangeAuthCode, revokeToken } from "@agrigoryan/questrade-api";
import { loadAuth, saveAuth, deleteAuth, getProfile, type StoredAuth } from "../config/store.js";
import { requireFlag, getFlag } from "../cli/parser.js";
import { output, type OutputFormat } from "../cli/output.js";

export async function handleAuthLogin(
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const refreshToken = requireFlag(flags, "refresh-token", "Questrade refresh token");
  const practice =
    flags.practice === "true" ||
    process.env.QUESTRADE_PRACTICE === "1" ||
    process.env.QUESTRADE_PRACTICE === "true";
  const profile = getFlag(flags, "profile") ?? getProfile();

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

  output(
    {
      status: "authenticated",
      apiServer: stored.apiServer,
      expiresAt: new Date(stored.expiresAt).toISOString(),
      practice,
      profile,
    },
    format,
  );
}

export async function handleAuthCallback(
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const code = requireFlag(flags, "code", "Authorization code");
  const clientId = requireFlag(flags, "client-id", "OAuth client ID");
  const redirectUri = requireFlag(flags, "redirect-uri", "OAuth redirect URI");
  const practice =
    flags.practice === "true" ||
    process.env.QUESTRADE_PRACTICE === "1" ||
    process.env.QUESTRADE_PRACTICE === "true";
  const profile = getFlag(flags, "profile") ?? getProfile();

  const creds = await exchangeAuthCode(code, clientId, redirectUri, practice);
  const stored: StoredAuth = {
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken,
    apiServer: creds.apiServer,
    tokenType: creds.tokenType,
    expiresAt: Date.now() + creds.expiresIn * 1000,
    practice,
  };
  saveAuth(stored, profile);

  output(
    {
      status: "authenticated",
      apiServer: stored.apiServer,
      expiresAt: new Date(stored.expiresAt).toISOString(),
      practice,
      profile,
    },
    format,
  );
}

export async function handleAuthStatus(
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const profile = getFlag(flags, "profile") ?? getProfile();
  const auth = loadAuth(profile);

  if (!auth) {
    output(
      {
        status: "not_authenticated",
        profile,
        hint: "Run: questrade auth login --refresh-token <token>",
      },
      format,
    );
    return;
  }

  const expired = Date.now() >= auth.expiresAt;

  output(
    {
      status: expired ? "expired" : "authenticated",
      apiServer: auth.apiServer,
      expiresAt: new Date(auth.expiresAt).toISOString(),
      practice: auth.practice,
      profile,
    },
    format,
  );
}

export async function handleAuthRevoke(
  flags: Record<string, string>,
  format: OutputFormat,
): Promise<void> {
  const profile = getFlag(flags, "profile") ?? getProfile();
  const auth = loadAuth(profile);

  if (!auth) {
    output({ status: "not_authenticated", profile }, format);
    return;
  }

  try {
    await revokeToken(auth.refreshToken, auth.practice);
  } catch {}

  deleteAuth(profile);
  output({ status: "revoked", profile }, format);
}
