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
    const { scriptText, projectId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Gerar Premissa baseada no roteiro
    console.log("Gerando premissa...");
    const premiseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um roteirista profissional especializado em análise de roteiros." },
          { role: "user", content: `Analise o roteiro a seguir e extraia uma premissa concisa em 2-3 linhas que capture a essência da história, o protagonista, o conflito central e o que torna única.\n\nRoteiro:\n${scriptText.slice(0, 3000)}` },
        ],
      }),
    });

    if (!premiseResponse.ok) throw new Error("Erro ao gerar premissa");
    const premiseData = await premiseResponse.json();
    const premiseText = premiseData.choices?.[0]?.message?.content || "";

    // Salvar premissa
    await supabase.from("project_content").upsert({
      project_id: projectId,
      content_type: "premise",
      content: { text: premiseText },
    });

    // 2. Gerar Argumento
    console.log("Gerando argumento...");
    const argumentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um roteirista profissional especializado em desenvolvimento de argumentos." },
          { role: "user", content: `Baseado no roteiro, crie um argumento completo de 300-400 palavras com apresentação, desenvolvimento, clímax e resolução.\n\nPremissa: ${premiseText}\n\nRoteiro:\n${scriptText.slice(0, 4000)}` },
        ],
      }),
    });

    if (!argumentResponse.ok) throw new Error("Erro ao gerar argumento");
    const argumentData = await argumentResponse.json();
    const argumentText = argumentData.choices?.[0]?.message?.content || "";

    await supabase.from("project_content").upsert({
      project_id: projectId,
      content_type: "argument",
      content: { text: argumentText },
    });

    // 3. Gerar Storyline (3 atos)
    console.log("Gerando storyline...");
    const storylineResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um roteirista profissional. Responda APENAS com JSON válido." },
          { role: "user", content: `Analise o roteiro e crie uma storyline estruturada em 3 atos. Retorne APENAS JSON: {"act1": "texto", "act2": "texto", "act3": "texto"}. Cada ato com pelo menos 100 palavras.\n\nRoteiro:\n${scriptText.slice(0, 5000)}` },
        ],
      }),
    });

    if (!storylineResponse.ok) throw new Error("Erro ao gerar storyline");
    const storylineData = await storylineResponse.json();
    let storylineContent = storylineData.choices?.[0]?.message?.content || "";
    
    // Extrair JSON do markdown se necessário
    const jsonMatch = storylineContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) storylineContent = jsonMatch[0];
    const storylineActs = JSON.parse(storylineContent);

    await supabase.from("project_content").upsert({
      project_id: projectId,
      content_type: "storyline",
      content: { acts: storylineActs },
    });

    // 4. Gerar Escaleta (beat sheet)
    console.log("Gerando escaleta...");
    const beatSheetResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um roteirista profissional. Responda APENAS com JSON válido." },
          { role: "user", content: `Analise o roteiro e crie uma escaleta com 8-12 cenas. Retorne APENAS um array JSON: [{"id": "scene-X", "number": 1, "intExt": "INT", "location": "LOCAL", "dayNight": "DIA", "description": "descrição", "characters": [], "duration": 2}]\n\nRoteiro:\n${scriptText.slice(0, 6000)}` },
        ],
      }),
    });

    if (!beatSheetResponse.ok) throw new Error("Erro ao gerar escaleta");
    const beatSheetData = await beatSheetResponse.json();
    let beatSheetContent = beatSheetData.choices?.[0]?.message?.content || "";
    
    // Extrair JSON do markdown
    const beatJsonMatch = beatSheetContent.match(/\[[\s\S]*\]/);
    if (beatJsonMatch) beatSheetContent = beatJsonMatch[0];
    const beatScenes = JSON.parse(beatSheetContent);

    await supabase.from("project_content").upsert({
      project_id: projectId,
      content_type: "beat_sheet",
      content: { scenes: beatScenes },
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Todo o conteúdo foi gerado com sucesso!",
        generated: {
          premise: true,
          argument: true,
          storyline: true,
          beatSheet: true,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar roteiro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
