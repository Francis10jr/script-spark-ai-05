import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Save } from "lucide-react";

interface StorylineTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  premise?: string;
  argument?: string;
  script?: string;
}

export const StorylineTab = ({ content, onSave, projectId, premise, argument, script }: StorylineTabProps) => {
  const [acts, setActs] = useState({
    act1: content?.acts?.act1 || "",
    act2: content?.acts?.act2 || "",
    act3: content?.acts?.act3 || "",
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!premise && !argument && !script) {
      toast.error("Crie uma premissa/argumento primeiro ou tenha um roteiro salvo");
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "storyline",
            context: { premise, argument, script },
          }),
        }
      );

      if (!response.ok) throw new Error("Erro na geração");
      
      const data = await response.json();
      
      // Remove markdown code blocks se existirem
      let cleanContent = data.content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
      }
      
      const generatedActs = JSON.parse(cleanContent);
      setActs(generatedActs);
      toast.success("Storyline gerada!");
    } catch (error) {
      toast.error("Erro ao gerar storyline");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({ acts });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storyline - Estrutura em 3 Atos</CardTitle>
          <CardDescription>
            Estruture sua história seguindo a narrativa clássica dos três atos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Ato 1 - Apresentação
              </h3>
              <Textarea
                value={acts.act1}
                onChange={(e) => setActs({ ...acts, act1: e.target.value })}
                placeholder="Apresente o mundo, protagonista e o conflito inicial..."
                rows={5}
                className="resize-none"
              />
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm">2</span>
                Ato 2 - Confrontação
              </h3>
              <Textarea
                value={acts.act2}
                onChange={(e) => setActs({ ...acts, act2: e.target.value })}
                placeholder="Desenvolva os obstáculos, conflitos e transformações do protagonista..."
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm">3</span>
                Ato 3 - Resolução
              </h3>
              <Textarea
                value={acts.act3}
                onChange={(e) => setActs({ ...acts, act3: e.target.value })}
                placeholder="Resolva o conflito principal e mostre as consequências..."
                rows={5}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? "Gerando..." : "Gerar Estrutura com IA"}
            </Button>
            <Button onClick={handleSave} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
