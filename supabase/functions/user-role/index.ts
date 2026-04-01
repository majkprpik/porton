import { createClient } from "npm:@supabase/supabase-js@2.46.1";
console.info("user-role function started");

const allowedOrigins = [
  "http://localhost:4200",
  "https://kompa-front-env-staging-majkprpiks-projects.vercel.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[1];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      db: { schema: "porton" }
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: userErr?.message || "Invalid user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const userId = userData.user.id;
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role_id, is_deleted")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!profile) {
      return new Response(JSON.stringify({ role: null, is_deleted: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    let roleName = null;
    if (profile.role_id) {
      const { data: role, error: roleErr } = await supabase
        .from("profile_roles")
        .select("name")
        .eq("id", profile.role_id)
        .maybeSingle();
      if (roleErr) {
        return new Response(JSON.stringify({ error: roleErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      roleName = role?.name ?? null;
    }
    return new Response(JSON.stringify({ role: roleName, is_deleted: profile.is_deleted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
