import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apiKey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { hcpCode, currentPassword, newPassword } = await req.json();

    // fetch user profile
    const { data: user, error: fetchError } = await supabaseClient
      .from("hospitalprofile")
      .select("password")
      .eq("hcpcode", hcpCode)
      .single();

    if (fetchError || !user) throw new Error("User profile not found");

    // compare hashes
    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== user.password) throw new Error("Current password is incorrect");

    // hash new password
    const newHash = await hashPassword(newPassword);

    const { error: updateError } = await supabaseClient
      .from("hospitalprofile")
      .update({ password: newHash })
      .eq("hcpcode", hcpCode);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
