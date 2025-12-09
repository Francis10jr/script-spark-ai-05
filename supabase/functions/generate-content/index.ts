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
        systemPrompt = `Você é um diretor de fotografia experiente. Analise a descrição da cena e gere APENAS os planos NECESSÁRIOS e ESPECÍFICOS para o que está descrito. NÃO gere planos genéricos ou desnecessários.

PRINCÍPIO: Menos é mais. Cada plano deve ter um propósito claro baseado na ação descrita.`;

        userPrompt = `Analise esta cena e crie uma decupagem técnica com APENAS os planos NECESSÁRIOS para contar o que está descrito. NÃO adicione planos genéricos.

CENA ${context.scene_number} - ${context.int_ext}. ${context.location} - ${context.time_of_day}

DESCRIÇÃO:
${context.description}

REGRAS:
1. Leia a descrição cuidadosamente e identifique APENAS as ações e elementos que precisam ser mostrados
2. Gere o número EXATO de planos necessários (pode ser 3, 5, 8 ou mais - depende do que a cena descreve)
3. Para cenas curtas e simples: 3-5 planos são suficientes
4. Para cenas complexas com múltiplas ações: mais planos são necessários
5. Cada plano deve servir para mostrar algo ESPECÍFICO da descrição
6. NÃO adicione planos "de reação" ou "inserts" se não forem mencionados ou implícitos na descrição

FORMATO - Retorne APENAS um array JSON:
[
  {
    "shot_number": "${context.scene_number}.1",
    "shot_type": "PG",
    "framing": "Frontal",
    "movement": "Fixa",
    "lens": "35mm",
    "equipment": ["Tripé"],
    "lighting_setup": "Descrição da luz",
    "sound_notes": "Notas de som",
    "vfx_notes": "Nenhum",
    "notes": "Propósito específico do plano baseado na descrição",
    "estimated_setup_time": 10
  }
]

IMPORTANTE: Gere apenas o que a cena REALMENTE precisa. Qualidade > Quantidade.`;
        break;

      case "budget":
        systemPrompt = `Você é um produtor executivo de cinema experiente, especialista em orçamentos de produção audiovisual brasileira. Crie orçamentos detalhados e realistas baseados no conteúdo do projeto.`;
        userPrompt = `Baseado no seguinte projeto audiovisual, crie uma lista de itens de orçamento completa e realista.

INFORMAÇÕES DO PROJETO:
- Número de cenas: ${context.scenesCount || "não especificado"}
- Roteiro: ${context.script ? "Sim" : "Não disponível"}
- Cenas: ${JSON.stringify(context.scenes?.slice(0, 5) || [])}

INSTRUÇÕES:
1. Crie entre 15-30 itens de orçamento cobrindo todas as categorias principais
2. Inclua: pré-produção, produção, pós-produção, elenco, equipe técnica, locação, equipamento, arte, figurino, alimentação, transporte
3. Use valores realistas em Reais (BRL) para o mercado brasileiro
4. Considere a escala do projeto baseada no número de cenas

FORMATO - Retorne APENAS um objeto JSON:
{
  "items": [
    {
      "item_name": "Diretor de Fotografia",
      "description": "Diárias de trabalho + prep",
      "category": "equipe",
      "quantity": 5,
      "unit": "diária",
      "unit_price": 1500,
      "notes": "Inclui equipamento próprio"
    }
  ]
}

Categorias válidas: pre_producao, producao, pos_producao, elenco, equipe, locacao, equipamento, arte, figurino, maquiagem, alimentacao, transporte, seguro, marketing, contingencia, outros`;
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
