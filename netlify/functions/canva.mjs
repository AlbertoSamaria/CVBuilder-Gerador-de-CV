const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const CANVA_API = "https://api.canva.com/rest/v1";

function json(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function cookie(name, value, options = {}) {
  const parts = [name + "=" + encodeURIComponent(value)];
  if (options.maxAge !== undefined) parts.push("Max-Age=" + options.maxAge);
  parts.push("Path=/");
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  if (options.secure !== false) parts.push("Secure");
  return parts.join("; ");
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").slice(0, length);
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function sha256(value) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

async function deriveSessionKey() {
  const secret = process.env.CANVA_SESSION_SECRET;
  if (!secret) return null;
  const digest = await sha256(secret);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptSession(payload) {
  const key = await deriveSessionKey();
  if (!key) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return bytesToBase64Url(combined);
}

async function decryptSession(value) {
  if (!value) return null;
  const key = await deriveSessionKey();
  if (!key) return null;
  try {
    const combined = base64UrlToBytes(value);
    if (combined.length < 13) return null;
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    return null;
  }
}

function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  const item = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

function config() {
  return {
    clientId: process.env.CANVA_CLIENT_ID || "",
    clientSecret: process.env.CANVA_CLIENT_SECRET || "",
    redirectUri: process.env.CANVA_REDIRECT_URI || "",
    sessionSecret: process.env.CANVA_SESSION_SECRET || ""
  };
}

function scopes() {
  return [
    "design:content:read",
    "design:content:write",
    "design:meta:read",
    "brandtemplate:meta:read",
    "brandtemplate:content:read",
    "asset:read",
    "asset:write"
  ].join(" ");
}

async function exchangeCode(code, verifier) {
  const { clientId, clientSecret, redirectUri } = config();
  const credentials = btoa(clientId + ":" + clientSecret);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri
  });

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Falha ao obter o token Canva.");
  }
  return data;
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = config();
  const credentials = btoa(clientId + ":" + clientSecret);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || "Falha ao renovar o token Canva.");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function getSession(request) {
  const encrypted = getCookie(request, "cv_canva_session");
  const session = await decryptSession(encrypted);
  if (!session?.access_token) return null;

  const expiresAt = Number(session.expires_at || 0);
  if (expiresAt && Date.now() < expiresAt - 60000) return session;

  if (!session.refresh_token) return null;

  try {
    const refreshed = await refreshAccessToken(session.refresh_token);
    return {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || session.refresh_token,
      expires_at: Date.now() + Math.max(60, Number(refreshed.expires_in || 14400)) * 1000,
      scope: refreshed.scope || session.scope || ""
    };
  } catch {
    return null;
  }
}

async function canvaRequest(path, token, options = {}) {
  const response = await fetch(CANVA_API + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || data.error || "A API Canva devolveu HTTP " + response.status + ".";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function clearSessionHeaders() {
  return { "Set-Cookie": cookie("cv_canva_session", "", { maxAge: 0 }) };
}

async function sessionResponse(session, payload, status = 200, extraHeaders = {}) {
  const encrypted = await encryptSession(session);
  return json(status, payload, {
    ...extraHeaders,
    "Set-Cookie": cookie("cv_canva_session", encrypted, { maxAge: 60 * 60 * 24 * 30 })
  });
}

async function sessionErrorResponse(session, error, fallback, status = 502) {
  const message = error?.message || fallback;
  if (error?.status === 401) {
    return json(401, { error: message }, clearSessionHeaders());
  }
  return sessionResponse(session, { error: message }, status);
}

function normalizeAutofillData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const [key, field] of Object.entries(value)) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) continue;
    if (!field || typeof field !== "object" || Array.isArray(field)) continue;
    if (field.type === "text" && typeof field.text === "string") {
      result[key] = { type: "text", text: field.text.slice(0, 5000) };
    } else if (field.type === "image" && typeof field.asset_id === "string") {
      result[key] = { type: "image", asset_id: field.asset_id };
    }
  }
  return result;
}

export default async function handler(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store"
      }
    });
  }

  const cfg = config();

  if (request.method === "GET" && action === "status") {
    const configured = Boolean(cfg.clientId && cfg.clientSecret && cfg.redirectUri && cfg.sessionSecret);
    const session = configured ? await getSession(request) : null;
    const payload = {
      ok: true,
      service: "canva",
      configured,
      connected: Boolean(session?.access_token),
      capabilities: {
        designImport: true,
        brandTemplates: true,
        autofill: true
      }
    };
    return session?.access_token ? sessionResponse(session, payload) : json(200, payload);
  }

  if (request.method === "GET" && action === "authorize") {
    if (!cfg.clientId || !cfg.clientSecret || !cfg.redirectUri || !cfg.sessionSecret) {
      return json(500, {
        error: "Canva ainda não está configurado no backend. Defina CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_REDIRECT_URI e CANVA_SESSION_SECRET."
      });
    }

    const verifier = randomString(64);
    const challenge = bytesToBase64Url(new Uint8Array(await sha256(verifier)));
    const state = randomString(48);
    const oauthState = await encryptSession({
      state,
      verifier,
      expires_at: Date.now() + 10 * 60 * 1000
    });

    if (!oauthState) {
      return json(500, { error: "Não foi possível proteger a sessão OAuth do Canva." });
    }

    const params = new URLSearchParams({
      code_challenge: challenge,
      code_challenge_method: "S256",
      scope: scopes(),
      response_type: "code",
      client_id: cfg.clientId,
      state,
      redirect_uri: cfg.redirectUri
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: CANVA_AUTHORIZE_URL + "?" + params.toString(),
        "Set-Cookie": cookie("cv_canva_oauth", oauthState, { maxAge: 600 })
      }
    });
  }

  if (request.method === "GET" && action === "callback") {
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const stored = await decryptSession(getCookie(request, "cv_canva_oauth")) || {};
    const oauthExpired = !stored.expires_at || Date.now() > Number(stored.expires_at);

    if (!cfg.clientId || !code || !returnedState || !stored.state || returnedState !== stored.state || !stored.verifier || oauthExpired) {
      return json(400, { error: "OAuth Canva inválido ou expirado. Inicie a ligação novamente." }, {
        "Set-Cookie": cookie("cv_canva_oauth", "", { maxAge: 0 })
      });
    }

    try {
      const token = await exchangeCode(code, stored.verifier);
      if (!token.access_token) {
        return json(502, { error: "Canva não devolveu um access token." });
      }

      const session = {
        access_token: token.access_token,
        refresh_token: token.refresh_token || "",
        expires_at: Date.now() + Math.max(60, Number(token.expires_in || 14400)) * 1000,
        scope: token.scope || ""
      };

      const encrypted = await encryptSession(session);
      if (!encrypted) {
        return json(500, { error: "CANVA_SESSION_SECRET não está configurado correctamente." });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/?canva=connected",
          "Set-Cookie": cookie("cv_canva_session", encrypted, { maxAge: 60 * 60 * 24 * 30 })
        }
      });
    } catch (error) {
      console.error("Canva OAuth callback failed", error);
      return json(502, { error: error.message || "Não foi possível concluir a ligação ao Canva." }, {
        "Set-Cookie": cookie("cv_canva_oauth", "", { maxAge: 0 })
      });
    }
  }

  let session = await getSession(request);
  if (!session?.access_token) {
    return json(401, { error: "Ligue primeiro a sua conta Canva." }, clearSessionHeaders());
  }

  if (request.method === "POST" && action === "import") {
    try {
      const form = await request.formData();
      const file = form.get("file");

      if (!file || typeof file.arrayBuffer !== "function") {
        return sessionResponse(session, { error: "Seleccione um ficheiro PDF ou Word." }, 400);
      }
      if (file.size > 15 * 1024 * 1024) {
        return sessionResponse(session, { error: "O ficheiro excede o limite de 15 MB." }, 413);
      }

      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
      ];

      if (file.type && !allowed.includes(file.type)) {
        return sessionResponse(session, { error: "Para o Canva, use PDF ou Word (.doc/.docx)." }, 400);
      }

      const title = String(form.get("title") || file.name || "CVBuilder")
        .replace(/[^\p{L}\p{N}\s._-]/gu, "")
        .trim()
        .slice(0, 50) || "CVBuilder";

      const metadata = JSON.stringify({
        title_base64: bytesToBase64(new TextEncoder().encode(title)),
        mime_type: file.type || "application/octet-stream"
      });

      const created = await canvaRequest("/imports", session.access_token, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Import-Metadata": metadata
        },
        body: await file.arrayBuffer()
      });

      const jobId = created?.job?.id;
      if (!jobId) {
        return sessionResponse(session, { error: "Canva não devolveu o ID do trabalho de importação." }, 502);
      }

      return sessionResponse(session, {
        jobId,
        status: created?.job?.status || "in_progress"
      }, 200);
    } catch (error) {
      console.error("Canva import failed", error);
      return sessionErrorResponse(session, error, "Não foi possível importar o currículo para o Canva.");
    }
  }

  if (request.method === "GET" && action === "import-status") {
    const jobId = url.searchParams.get("jobId");
    if (!jobId) return sessionResponse(session, { error: "ID de importação em falta." }, 400);

    try {
      const data = await canvaRequest("/imports/" + encodeURIComponent(jobId), session.access_token);
      return sessionResponse(session, data);
    } catch (error) {
      return sessionErrorResponse(session, error, "Não foi possível consultar a importação Canva.");
    }
  }

  if (request.method === "GET" && action === "templates") {
    try {
      const query = String(url.searchParams.get("query") || "").slice(0, 120);
      const params = new URLSearchParams({ limit: "50", dataset: "non_empty" });
      if (query) params.set("query", query);
      const data = await canvaRequest("/brand-templates?" + params.toString(), session.access_token);
      return sessionResponse(session, data);
    } catch (error) {
      return sessionErrorResponse(session, error, "Não foi possível carregar os templates Canva.");
    }
  }

  if (request.method === "GET" && action === "template-dataset") {
    const templateId = url.searchParams.get("templateId");
    if (!templateId) return sessionResponse(session, { error: "ID do template em falta." }, 400);

    try {
      const data = await canvaRequest("/brand-templates/" + encodeURIComponent(templateId) + "/dataset", session.access_token);
      return sessionResponse(session, data);
    } catch (error) {
      return sessionErrorResponse(session, error, "Não foi possível obter os campos do template Canva.");
    }
  }

  if (request.method === "POST" && action === "autofill") {
    try {
      const body = await request.json();
      const templateId = typeof body?.brandTemplateId === "string" ? body.brandTemplateId.trim() : "";
      if (!templateId) return sessionResponse(session, { error: "ID do template Canva em falta." }, 400);

      const data = normalizeAutofillData(body?.data);
      if (!Object.keys(data).length) {
        return sessionResponse(session, { error: "Nenhum campo válido foi enviado para o Autofill." }, 400);
      }

      const created = await canvaRequest("/autofills", session.access_token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_from_brand_template",
          brand_template_id: templateId,
          data
        })
      });

      return sessionResponse(session, {
        jobId: created?.job?.id,
        status: created?.job?.status || "in_progress"
      });
    } catch (error) {
      console.error("Canva autofill failed", error);
      return sessionErrorResponse(session, error, "Não foi possível iniciar o Autofill Canva.");
    }
  }

  if (request.method === "GET" && action === "autofill-status") {
    const jobId = url.searchParams.get("jobId");
    if (!jobId) return sessionResponse(session, { error: "ID do Autofill em falta." }, 400);

    try {
      const data = await canvaRequest("/autofills/" + encodeURIComponent(jobId), session.access_token);
      return sessionResponse(session, data);
    } catch (error) {
      return sessionErrorResponse(session, error, "Não foi possível consultar o Autofill Canva.");
    }
  }

  if (request.method === "POST" && action === "disconnect") {
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": cookie("cv_canva_session", "", { maxAge: 0 }) }
    });
  }

  return json(405, { error: "Método ou operação Canva não permitido." });
}
