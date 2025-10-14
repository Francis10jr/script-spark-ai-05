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

    console.log(`Gerando decupagem técnica para ${scenes.length} cenas...`);

    // Para cada cena, gerar planos técnicos
    for (const scene of scenes) {
      const prompt = `Analise a seguinte cena e crie uma decupagem técnica detalhada com 3-8 planos:

CENA ${scene.scene_number} - ${scene.int_ext} ${scene.location} - ${scene.time_of_day}
Descrição: ${scene.description}

Retorne APENAS um array JSON com planos no formato:
[
  {
    "shot_number": "1A",
    "shot_type": "tipo do plano (ex: Plano geral, Plano médio, Close-up)",
    "framing": "enquadramento (ex: Simétrico, Regra dos terços)",
    "movement": "movimento (ex: Estática, Pan direita, Dolly in, Tracking)",
    "lens": "lente sugerida (ex: 24mm, 50mm, 85mm)",
    "equipment": ["equipamento1", "equipamento2"],
    "lighting_setup": "descrição do setup de iluminação",
    "sound_notes": "notas sobre captação de áudio",
    "vfx_notes": "notas sobre efeitos visuais necessários",
    "estimated_setup_time": 15,
    "notes": "observações gerais sobre o plano"
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
            { role: "system", content: "Você é um diretor de fotografia e assistente de direção especializado em decupagem técnica. Responda APENAS com JSON válido." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Erro ao gerar decupagem para cena ${scene.scene_number}`);
      
      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";
      
      // Extrair JSON do markdown
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) content = jsonMatch[0];
      
      const shots = JSON.parse(content);

      // Salvar planos no banco
      for (const shot of shots) {
        await supabase.from("technical_breakdown").insert({
          scene_id: scene.id,
          shot_number: shot.shot_number,
          shot_type: shot.shot_type,
          framing: shot.framing,
          movement: shot.movement,
          lens: shot.lens,
          equipment: shot.equipment,
          lighting_setup: shot.lighting_setup,
          sound_notes: shot.sound_notes,
          vfx_notes: shot.vfx_notes,
          estimated_setup_time: shot.estimated_setup_time,
          notes: shot.notes,
        });
      }

      console.log(`Decupagem gerada para cena ${scene.scene_number}: ${shots.length} planos`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Decupagem técnica gerada para ${scenes.length} cenas!`,
        totalScenes: scenes.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar decupagem técnica" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
