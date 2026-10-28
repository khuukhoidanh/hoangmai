const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("MIYO Assistant webhook bridge is ready.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    if (request.method === "OPTIONS" && url.pathname === "/poll") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method === "POST" && url.pathname === "/telegram") {
      return handleTelegramUpdate(request, env);
    }
    if (request.method === "POST" && url.pathname === "/poll") {
      return handleWebsitePoll(request, env);
    }
    return new Response("Not found", { status: 404 });
  }
};

async function handleTelegramUpdate(request, env) {
  const incomingSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (!env.TELEGRAM_WEBHOOK_SECRET || incomingSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update;
  try { update = await request.json(); }
  catch (error) { return new Response("Invalid JSON", { status: 400 }); }

  try {
    const result = await postToAppsScript(env, {
      action: "supportChatTelegramWebhook",
      bridgeSecret: env.SUPPORT_BRIDGE_SECRET,
      update
    });
    if (!result.ok) return new Response("Apps Script did not accept update", { status: 502 });
    return new Response("OK");
  } catch (error) {
    console.error("Telegram update forwarding failed", error);
    return new Response("Temporary forwarding error", { status: 502 });
  }
}

async function handleWebsitePoll(request, env) {
  let payload;
  try { payload = await request.json(); }
  catch (error) { return json({ ok: false, error: "Invalid request." }, 400); }
  if (!payload || payload.action !== "supportChatPoll" || !payload.chatId || !payload.accessToken) {
    return json({ ok: false, error: "Invalid chat poll." }, 400);
  }
  try {
    const result = await postToAppsScript(env, payload);
    return json(result, 200);
  } catch (error) {
    console.error("Website chat poll forwarding failed", error);
    return json({ ok: false, error: "Could not load chat messages." }, 502);
  }
}

async function postToAppsScript(env, payload) {
  if (!env.APPS_SCRIPT_URL) throw new Error("APPS_SCRIPT_URL secret is missing");
  const response = await fetch(env.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Apps Script returned HTTP " + response.status);
  const result = await response.json();
  if (!result || result.ok !== true) throw new Error("Apps Script rejected the request");
  return result;
}

function json(value, status) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
