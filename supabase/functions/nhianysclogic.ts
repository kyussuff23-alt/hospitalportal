import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const body = await req.json()
    const { refId, biodata, selectedItems, hospitalName, hcpCode } = body

    // 1. Structure Verification Check
    if (!refId || !biodata || !selectedItems || selectedItems.length === 0 || !hcpCode) {
      return new Response(
        JSON.stringify({ error: "Missing required payload parameters." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Custom Authentication Verification Check
    const { data: validHospital, error: verifyError } = await supabaseClient
      .from("nhiahospital")
      .select("nhiacode")
      .eq("nhiacode", hcpCode)
      .maybeSingle()

    if (verifyError || !validHospital) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Unrecognized HCP Code configuration." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. ⚡ ATOMIC TRANSACTION EXECUTION via SQL Database Stored Procedure
    const { error: transactionError } = await supabaseClient.rpc("insert_nhia_claim", {
      p_refid: refId,
      p_biodata: biodata,
      p_selected_items: selectedItems,
      p_hospital_name: hospitalName,
      p_hcp_code: hcpCode
    });

    if (transactionError) {
      // Catching explicit database issues like unique key constraint violations cleanly
      if (transactionError.message.includes("unique constraint")) {
        return new Response(
          JSON.stringify({ error: "This claim reference has already been processed or is currently transmitting." }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`Database Transaction Execution Failure: ${transactionError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Claim payload structural routing transaction successful." }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
