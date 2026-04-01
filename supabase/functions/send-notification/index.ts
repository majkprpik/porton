import { createClient } from "npm:@supabase/supabase-js@2.46.1";

console.info("send-notification function started");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Base64url encode for JWT
function base64url(data: Uint8Array): string {
  const binStr = Array.from(data, (b) => String.fromCharCode(b)).join("");
  return btoa(binStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Get OAuth2 access token from service account credentials
async function getAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key for signing
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(unsignedToken))
  );

  const signedJwt = `${unsignedToken}.${base64url(signature)}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!jwt) {
      return jsonResponse({ error: "Missing bearer token" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: `Bearer ${jwt}` },
        },
        db: { schema: "porton" },
      }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return jsonResponse(
        { error: userErr?.message || "Invalid user token" },
        401
      );
    }

    // Parse request body — accepts profileId (string) or profileIds (string[])
    const body = await req.json();
    const notification = body.notification;
    const profileIds: string[] = body.profileIds ?? (body.profileId ? [body.profileId] : []);

    if (!profileIds.length || !notification?.title || !notification?.body) {
      return jsonResponse(
        { error: "Missing required fields: profileId(s), notification.title, notification.body" },
        400
      );
    }

    // Use service role client to read devices (RLS may restrict access)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "porton" } }
    );

    const { data: devices, error: devicesErr } = await supabaseAdmin
      .from("user_devices")
      .select("fcm_token")
      .in("profile_id", profileIds);

    if (devicesErr) {
      return jsonResponse({ error: devicesErr.message }, 500);
    }

    if (!devices || devices.length === 0) {
      return jsonResponse({ message: "No registered devices for these profiles", sent: 0 });
    }

    // Parse FCM service account and get OAuth2 token
    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return jsonResponse({ error: "FCM_SERVICE_ACCOUNT not configured" }, 500);
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    // Send FCM v1 notifications to all devices
    const results = await Promise.allSettled(
      devices.map((device) =>
        fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: device.fcm_token,
                notification: {
                  title: notification.title,
                  body: notification.body,
                },
                webpush: {
                  notification: {
                    icon: notification.icon || "/assets/icons/porton-icon-72x72.png",
                  },
                },
              },
            }),
          }
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => String(r.reason));
      console.error("FCM send failures:", errors);
    }

    return jsonResponse({ sent, failed, total: devices.length });
  } catch (e) {
    console.error("Unexpected error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
