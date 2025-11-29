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
        if (context.script) {
          userPrompt = `Analise o seguinte roteiro completo e extraia a premissa em 2-3 linhas. A premissa deve apresentar o protagonista, o conflito central e o que torna a história única.\n\nRoteiro:\n${context.script}`;
        } else {
          userPrompt = "Crie uma premissa original e envolvente para um projeto audiovisual em 2-3 linhas. A premissa deve apresentar o protagonista, o conflito central e o que torna a história única. Seja criativo e específico.";
        }
        break;

      case "argument":
        systemPrompt = "Você é um roteirista profissional especializado em desenvolver argumentos narrativos completos.";
        if (context.script) {
          userPrompt = `Analise o seguinte roteiro completo e extraia/sintetize o argumento em aproximadamente 300-400 palavras. Desenvolva os personagens principais, a estrutura narrativa básica (apresentação, desenvolvimento, clímax, resolução) e os temas centrais da história.\n\nRoteiro:\n${context.script}`;
        } else {
          userPrompt = `Expanda a seguinte premissa em um argumento completo de aproximadamente 300-400 palavras. Desenvolva os personagens principais, a estrutura narrativa básica (apresentação, desenvolvimento, clímax, resolução) e os temas centrais da história.\n\nPremissa: ${context.premise}`;
        }
        break;

      case "storyline":
        systemPrompt = "Você é um roteirista profissional especializado em estruturação narrativa em três atos.";
        if (context.script) {
          userPrompt = `Analise o seguinte roteiro completo e estruture uma storyline em três atos. Retorne APENAS um objeto JSON válido no formato: {"act1": "texto do ato 1", "act2": "texto do ato 2", "act3": "texto do ato 3"}. Cada ato deve ter pelo menos 100 palavras descrevendo o que acontece no roteiro.\n\nRoteiro:\n${context.script}`;
        } else {
          userPrompt = `Baseado no seguinte contexto, crie uma storyline estruturada em três atos. Retorne APENAS um objeto JSON válido no formato: {"act1": "texto do ato 1", "act2": "texto do ato 2", "act3": "texto do ato 3"}. Cada ato deve ter pelo menos 100 palavras.\n\nContexto:\nPremissa: ${context.premise}\nArgumento: ${context.argument}`;
        }
        break;

      case "beat_sheet":
        systemPrompt = "Você é um roteirista profissional especializado em criar escaletas detalhadas a partir de roteiros.";
        if (context.script) {
          // Geração a partir do roteiro completo
          userPrompt = `Analise o seguinte roteiro completo e extraia TODAS as cenas dele em formato de escaleta. Identifique cada cena, seu número, se é INT/EXT, o local, período do dia (DIA/NOITE/etc), descrição do que acontece, personagens envolvidos e duração estimada em minutos (SEMPRE USE NÚMEROS INTEIROS para duration, nunca decimais). Retorne APENAS um array JSON válido de objetos no formato: [{"id": "scene-X", "number": 1, "intExt": "INT", "location": "nome do local", "dayNight": "DIA", "description": "descrição resumida da ação", "characters": ["personagem1", "personagem2"], "duration": 2}]\n\nIMPORTANTE: 
- Extraia TODAS as cenas do roteiro, não limite a 8-12. Se o roteiro tem 19 cenas, retorne 19. Se tem 8, retorne 8.
- O campo "duration" DEVE ser sempre um número inteiro (1, 2, 3, 4, 5, etc), NUNCA use decimais como 0.5 ou 1.5.\n\nRoteiro:\n${context.script}`;
        } else {
          // Geração a partir da storyline
          userPrompt = `Baseado na seguinte storyline, crie uma escaleta com 8-12 cenas. Retorne APENAS um array JSON válido de objetos no formato: [{"id": "scene-X", "number": 1, "intExt": "INT", "location": "nome do local", "dayNight": "DIA", "description": "descrição da cena", "characters": [], "duration": 2}]\n\nIMPORTANTE: O campo "duration" DEVE ser sempre um número inteiro (1, 2, 3, 4, 5, etc), NUNCA use decimais.\n\nStoryline:\nAto 1: ${context.storyline?.acts?.act1}\nAto 2: ${context.storyline?.acts?.act2}\nAto 3: ${context.storyline?.acts?.act3}`;
        }
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
        model: type === "beat_sheet" && context.script ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
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
