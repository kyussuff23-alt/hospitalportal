import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";


serve(async (req) => {
  // Fixed: Added proper string quotes around header keys and methods
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apiKey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Fixed: Added quotes to environment variable string keys
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { hcpCode, password } = await req.json();

    // Step 1: Check hospital exists
    const { data: hospital, error: hospitalError } = await supabaseClient
      .from("nhiahospital")
      .select("id, nhiacode, hospname")
      .eq("nhiacode", hcpCode)
      .single();

    if (hospitalError || !hospital) {
      return new Response(
        JSON.stringify({ error: "Please check your nhiacode or password again, otherwise contact NONSUCH." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Step 2: Fetch stored hash from nhia_auth
    const { data: auth, error: authError } = await supabaseClient
      .from("nhia_auth")
      .select("id, nhiacode, password")
      .eq("nhiacode", hcpCode)
      .single();

    if (authError || !auth) {
      return new Response(
        JSON.stringify({ error: "Please check your nhiacode or password again, otherwise contact NONSUCH." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Step 3: Compare plain-text password from frontend to stored DB hash
    const match = await bcrypt.compare(password, auth.password);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "Please check your nhiacode or password again, otherwise contact NONSUCH." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Success
    return new Response(
      JSON.stringify({ success: true, hospital }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
