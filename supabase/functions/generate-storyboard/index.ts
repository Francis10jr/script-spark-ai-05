import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar cenas do projeto
    const { data: scenes, error: scenesError } = await supabase
      .from("scenes")
      .select("*")
      .eq("project_id", projectId)
      .order("scene_number");

    if (scenesError) throw scenesError;
    if (!scenes || scenes.length === 0) {
      throw new Error("Nenhuma cena encontrada. Crie a escaleta primeiro.");
    }

    console.log(`Gerando storyboards para ${scenes.length} cenas...`);

    // Para cada cena, gerar frames de storyboard
    for (const scene of scenes) {
      const prompt = `Analise a seguinte cena e crie 3-5 frames de storyboard para visualizá-la:

CENA ${scene.scene_number} - ${scene.int_ext} ${scene.location} - ${scene.time_of_day}
Descrição: ${scene.description}

Retorne APENAS um array JSON com frames no formato:
[
  {
    "frame_number": 1,
    "description": "descrição do que é mostrado no quadro",
    "camera_angle": "ângulo da câmera (ex: Close-up, Plano médio, Plano geral)",
    "camera_movement": "movimento da câmera (ex: Estática, Pan, Tilt, Tracking)",
    "image_prompt": "prompt detalhado para gerar a imagem visual deste frame"
  }
]`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Você é um diretor de cinema especializado em storyboarding. Responda APENAS com JSON válido." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Erro ao gerar storyboard para cena ${scene.scene_number}`);
      
      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";
      
      // Extrair JSON do markdown
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) content = jsonMatch[0];
      
      const frames = JSON.parse(content);

      // Salvar frames no banco
      for (const frame of frames) {
        await supabase.from("storyboards").insert({
          scene_id: scene.id,
          frame_number: frame.frame_number,
          description: frame.description,
          camera_angle: frame.camera_angle,
          camera_movement: frame.camera_movement,
          image_prompt: frame.image_prompt,
        });
      }

      console.log(`Storyboard gerado para cena ${scene.scene_number}: ${frames.length} frames`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Storyboards gerados para ${scenes.length} cenas!`,
        totalScenes: scenes.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar storyboards" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
