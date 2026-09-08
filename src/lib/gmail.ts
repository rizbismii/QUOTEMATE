const TOKEN_KEY = "quotesnap-gmail-token";
const EMAIL_KEY = "quotesnap-gmail-email";
const EXP_KEY = "quotesnap-gmail-exp";
const CLIENT_KEY = "quotesnap-google-client-id";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPES = "https://www.googleapis.com/auth/gmail.send email";

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string; expires_in?: number }) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export function googleClientId(fromBusiness?: string): string {
  const env =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "" : "";
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(CLIENT_KEY) || "" : "";
  return (env || fromBusiness || stored).trim();
}

export function saveGoogleClientId(value: string) {
  if (typeof localStorage === "undefined") return;
  const trimmed = value.trim();
  if (trimmed) localStorage.setItem(CLIENT_KEY, trimmed);
  else localStorage.removeItem(CLIENT_KEY);
}

export function gmailLinkStatus(): { linked: boolean; email: string } {
  if (typeof sessionStorage === "undefined") return { linked: false, email: "" };
  const token = sessionStorage.getItem(TOKEN_KEY);
  const exp = Number(sessionStorage.getItem(EXP_KEY) || 0);
  const email = sessionStorage.getItem(EMAIL_KEY) || "";
  if (!token || Date.now() > exp) return { linked: false, email };
  return { linked: true, email };
}

function storeToken(accessToken: string, expiresIn: number, email: string) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(EXP_KEY, String(Date.now() + Math.max(60, expiresIn - 60) * 1000));
  if (email) sessionStorage.setItem(EMAIL_KEY, email);
}

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gis-load")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gis-load"));
    document.head.appendChild(script);
  });
}

async function profileEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { email?: string };
  return data.email || "";
}

export async function linkGmail(clientId: string): Promise<{ email: string }> {
  if (!clientId) throw new Error("missing-client-id");
  await loadGis();
  const oauth = window.google?.accounts.oauth2;
  if (!oauth) throw new Error("gis-missing");
  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || "denied"));
          return;
        }
        resolve(resp.access_token);
        void profileEmail(resp.access_token).then((email) => {
          storeToken(resp.access_token!, Number(resp.expires_in || 3600), email);
        });
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
  const email = await profileEmail(accessToken);
  storeToken(accessToken, 3600, email);
  return { email };
}

export function unlinkGmail() {
  if (typeof sessionStorage === "undefined") return;
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token && window.google?.accounts.oauth2) {
    window.google.accounts.oauth2.revoke(token);
  }
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
  sessionStorage.removeItem(EXP_KEY);
}

export async function sendViaGmail(rawRfc822: string): Promise<void> {
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : "";
  const exp = Number(typeof sessionStorage !== "undefined" ? sessionStorage.getItem(EXP_KEY) : 0);
  if (!token || Date.now() > exp) throw new Error("not-linked");
  const raw = utf8ToBase64Url(rawRfc822);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    throw new Error(`gmail-${res.status}`);
  }
}

function utf8ToBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
