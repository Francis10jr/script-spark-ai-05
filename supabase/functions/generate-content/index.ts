import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "premise":
        systemPrompt = "Você é um roteirista profissional especializado em criar premissas cinematográficas impactantes.";
        userPrompt = "Crie uma premissa original e envolvente para um projeto audiovisual em 2-3 linhas. A premissa deve apresentar o protagonista, o conflito central e o que torna a história única. Seja criativo e específico.";
        break;

      case "argument":
        systemPrompt = "Você é um roteirista profissional especializado em desenvolver argumentos narrativos completos.";
        userPrompt = `Expanda a seguinte premissa em um argumento completo de aproximadamente 300-400 palavras. Desenvolva os personagens principais, a estrutura narrativa básica (apresentação, desenvolvimento, clímax, resolução) e os temas centrais da história.\n\nPremissa: ${context.premise}`;
        break;

      case "storyline":
        systemPrompt = "Você é um roteirista profissional especializado em estruturação narrativa em três atos.";
        userPrompt = `Baseado no seguinte contexto, crie uma storyline estruturada em três atos. Retorne APENAS um objeto JSON válido no formato: {"act1": "texto do ato 1", "act2": "texto do ato 2", "act3": "texto do ato 3"}. Cada ato deve ter pelo menos 100 palavras.\n\nContexto:\nPremissa: ${context.premise}\nArgumento: ${context.argument}`;
        break;

      case "beat_sheet":
        systemPrompt = "Você é um roteirista profissional especializado em criar escaletas detalhadas. Responda APENAS com JSON válido.";
        userPrompt = `Analise o roteiro COMPLETO abaixo e identifique TODAS as cenas. Para cada cena encontrada no roteiro, crie um item na escaleta. Não limite o número de cenas - crie uma entrada para cada cena que você identificar no roteiro.

Retorne APENAS um array JSON válido de objetos no formato: 
[{"id": "scene-X", "number": 1, "intExt": "INT" ou "EXT", "location": "nome do local", "dayNight": "DIA" ou "NOITE" ou "ENTARDECER" ou "AMANHECER", "description": "descrição detalhada do que acontece na cena", "characters": ["nome1", "nome2"], "duration": 2}]

Roteiro completo:
${context.script || ''}`;
        break;

      case "script":
        systemPrompt = "Você é um roteirista profissional especializado em formatação de roteiros cinematográficos.";
        const scenesDesc = context.beatSheet?.scenes
          ?.map((s: any) => `CENA ${s.number} - ${s.intExt}. ${s.location} - ${s.dayNight}\n${s.description}`)
          .join("\n\n");
        userPrompt = `Baseado na seguinte escaleta, escreva um roteiro completo formatado profissionalmente. Inclua cabeçalhos de cena (INT/EXT, local, período), descrições de ação e diálogos realistas. Mantenha a formatação de roteiro tradicional.\n\nEscaleta:\n${scenesDesc}`;
        break;

      default:
        throw new Error("Tipo de conteúdo inválido");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Configurações > Workspace > Uso." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Erro na API de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar conteúdo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
