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

    console.log(`Generating content type: ${type}`);

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
          userPrompt = `Analise o seguinte roteiro completo e extraia TODAS as cenas dele em formato de escaleta. Identifique cada cena, seu número, se é INT/EXT, o local, período do dia (DIA/NOITE/etc), descrição do que acontece, personagens envolvidos e duração estimada em minutos (SEMPRE USE NÚMEROS INTEIROS para duration, nunca decimais). Retorne APENAS um array JSON válido de objetos no formato: [{"id": "scene-X", "number": 1, "intExt": "INT", "location": "nome do local", "dayNight": "DIA", "description": "descrição resumida da ação", "characters": ["personagem1", "personagem2"], "duration": 2}]\n\nIMPORTANTE: 
- Extraia TODAS as cenas do roteiro, não limite a 8-12. Se o roteiro tem 19 cenas, retorne 19. Se tem 8, retorne 8.
- O campo "duration" DEVE ser sempre um número inteiro (1, 2, 3, 4, 5, etc), NUNCA use decimais como 0.5 ou 1.5.\n\nRoteiro:\n${context.script}`;
        } else {
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

      case "technical_breakdown":
        systemPrompt = `Você é um diretor de fotografia premiado e 1º assistente de direção experiente. Você cria decupagens técnicas cinematográficas COMPLETAS e PROFISSIONAIS.

REGRAS OBRIGATÓRIAS:
1. Gere entre 8 e 20 planos por cena, dependendo da complexidade
2. NUNCA gere apenas 1 ou 2 planos - isso é insuficiente
3. Cubra TODA a ação da cena com planos específicos
4. Inclua obrigatoriamente: planos de estabelecimento, planos médios, close-ups, inserts e planos de reação`;

        userPrompt = `Crie uma DECUPAGEM TÉCNICA COMPLETA E PROFISSIONAL para esta cena. Você DEVE gerar MÚLTIPLOS PLANOS (entre 8 e 20) para cobrir toda a ação cinematograficamente.

CENA ${context.scene_number} - ${context.int_ext}. ${context.location} - ${context.time_of_day}

DESCRIÇÃO DA CENA:
${context.description}

INSTRUÇÕES OBRIGATÓRIAS:
1. Gere entre 8-20 planos diferentes para esta cena
2. OBRIGATÓRIO incluir: plano de estabelecimento (GPG ou PG), planos médios das ações, close-ups dos personagens, inserts de objetos importantes, planos de reação
3. Varie os tipos: GPG, PG, PA, PM, PP, PPP, Detalhe, Over-shoulder, POV
4. Varie movimentos: Fixa, Pan, Tilt, Travelling, Dolly, Steadicam, Handheld, Crane
5. Especifique lentes reais: 16mm, 24mm, 35mm, 50mm, 85mm, 100mm
6. Detalhe a iluminação para cada plano
7. Inclua notas de som específicas
8. Mencione VFX quando necessário

FORMATO DE RESPOSTA - Retorne APENAS um array JSON:
[
  {
    "shot_number": "${context.scene_number}.1",
    "shot_type": "GPG",
    "framing": "Frontal",
    "movement": "Fixa",
    "lens": "24mm",
    "equipment": ["Tripé", "Cabeça fluida"],
    "lighting_setup": "Luz natural, fill com rebatedor",
    "sound_notes": "Captar ambiente",
    "vfx_notes": "Nenhum",
    "notes": "Plano de estabelecimento",
    "estimated_setup_time": 15
  },
  ... mais 7-19 planos ...
]

ATENÇÃO: Gere TODOS os planos necessários. Uma cena completa precisa de NO MÍNIMO 8 planos.`;
        break;

      default:
        throw new Error("Tipo de conteúdo inválido");
    }

    console.log(`Sending request to AI gateway for type: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: (type === "beat_sheet" && context.script) || type === "technical_breakdown" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    console.log(`AI gateway response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status} - ${errorText}`);
      
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
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`AI response length: ${responseText.length} chars`);
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Resposta vazia da IA");
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Failed to parse AI response: ${responseText.substring(0, 500)}`);
      throw new Error("Resposta inválida da IA");
    }

    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data).substring(0, 500));
      throw new Error("Conteúdo vazio na resposta da IA");
    }

    console.log(`Successfully generated content, length: ${content.length} chars`);

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao gerar conteúdo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
