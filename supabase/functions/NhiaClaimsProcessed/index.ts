import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apiKey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const body = await req.json();
    // Destructure page and limit parameters sent by frontend
    const { action, hcpCode, refId, page = 1, limit = 10 } = body;

    if (!action || !hcpCode) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: action or hcpCode." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Custom Authentication / Validation Verification Check
    const { data: validHospital, error: verifyError } = await supabaseClient
      .from("nhiahospital")
      .select("nhiacode")
      .eq("nhiacode", hcpCode)
      .maybeSingle();

    if (verifyError || !validHospital) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Unrecognized NHIA HCP Code." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "fetch_all") {
      // 1. Calculate boundaries to prevent reading beyond 100 historical rows
      const targetPage = Math.max(1, parseInt(page));
      const targetLimit = Math.min(10, parseInt(limit)); // 10 rows per fetch chunk
      
      const startOffset = (targetPage - 1) * targetLimit;
      
      // Safety gate: If requested offset goes beyond 100 entries total, cut it off
      if (startOffset >= 100) {
        return new Response(
          JSON.stringify({ success: true, data: [], totalCount: 100 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Fetch the paginated chunk from the database dynamically using range selection
      const { data, error } = await supabaseClient
        .from("nhia_claims_biodata")
        .select("id, refid, enrolleename, nhianumber, status, authcode, created_at, hcpcode")
        .eq("hcpcode", hcpCode)
        .eq("status", "processed")
        .order("created_at", { ascending: false })
        .range(startOffset, startOffset + targetLimit - 1); // Only downloads exactly 10 rows

      if (error) throw error;

      // 3. Return total historical window count capped at 100 max
      return new Response(
        JSON.stringify({ success: true, data, totalCount: 100 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    
    if (action === "fetch_details") {
      if (!refId) {
        return new Response(
          JSON.stringify({ error: "Action 'fetch_details' requires refId." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
