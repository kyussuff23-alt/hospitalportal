import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";




const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apiKey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight options request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize premium Service Role client configuration
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const body = await req.json();
    const { action, hcpCode, refId } = body;

    // 1. Enforce strict parameter structural validation checks
    if (!action || !hcpCode) {
      return new Response(
        JSON.stringify({ error: "Missing required tracking parameters: action or hcpCode." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Custom Authentication / Validation Verification Check
    const { data: validHospital, error: verifyError } = await supabaseClient
      .from("nhiahospital")
      .select("nhiacode")
      .eq("nhiacode", hcpCode)
      .maybeSingle();

    if (verifyError || !validHospital) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Unrecognized NHIA HCP Code registry key configuration." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Action Route Handler Abstraction
    if (action === "fetch_all") {
      // Safely queries historical dashboard ledger entries matching the active facility hcpcode
      const { data, error } = await supabaseClient
        .from("nhia_claims_biodata")
        .select("id, refid, enrolleename, nhianumber, status, authcode, created_at, hcpcode")
        .eq("hcpcode", hcpCode)
        .in("status", ["pending","denied", "approved"]) // 🛡️ Strict inclusion gate (excludes denied entries)

        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    
    if (action === "fetch_details") {
      if (!refId) {
        return new Response(
          JSON.stringify({ error: "Action 'fetch_details' requires an explicit cross-table reference: refId." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Query cross-table associated pharmaceutical ledger matrix line items safely
      const { data, error } = await supabaseClient
        .from("nhia_claims_drugs")
        .select("*")
        .eq("refid", refId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback error handler gate for unrecognized request variants
    return new Response(
      JSON.stringify({ error: `Routing Mapping Failure: Action '${action}' is unrecognised.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
