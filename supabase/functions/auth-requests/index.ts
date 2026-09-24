import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apiKey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // safe to use service role here
    );

    const { hcpCode } = await req.json();

    const { data, error } = await supabaseClient
      .from("authrequest")
      .select(`
        id,
        enrolleename,
        policyid,
        client,
        diagnosis,
        hcpcode,
        hospname,
        authcode,
        reason,
        status,
        created_at,
        drugsrequest (
          id,
          itemname,
          price,
          qty,
          period,
          total,
          denialreason
        )
      `)
      .eq("hcpcode", hcpCode)
      .or("status.eq.approved,status.eq.pending,status.eq.denied")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
