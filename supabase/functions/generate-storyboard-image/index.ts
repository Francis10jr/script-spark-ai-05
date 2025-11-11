import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      prompt,
      sceneId,
      frameNumber,
      cameraAngle,
      cameraMovement,
      description,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Gerar imagem usando Lovable AI (Gemini Flash Image)
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro Lovable AI:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes. Adicione créditos ao seu workspace.");
      }
      
      throw new Error("Erro ao gerar imagem com IA");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("Nenhuma imagem foi gerada");
    }

    // Salvar storyboard no banco
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração Supabase não encontrada");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: storyboard, error: insertError } = await supabase
      .from("storyboards")
      .insert({
        scene_id: sceneId,
        frame_number: frameNumber,
        image_url: imageUrl,
        image_prompt: prompt,
        description: description,
        camera_angle: cameraAngle,
        camera_movement: cameraMovement,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao salvar storyboard:", insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ storyboard }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro na função generate-storyboard-image:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar storyboard" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
