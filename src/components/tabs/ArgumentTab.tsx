import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Save, FileDown } from "lucide-react";

interface ArgumentTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  premise?: string;
  script?: string;
}

export const ArgumentTab = ({ content, onSave, projectId, premise, script }: ArgumentTabProps) => {
  const [text, setText] = useState(content?.text || "");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!premise && !script) {
      toast.error("Crie uma premissa primeiro ou tenha um roteiro salvo");
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
            type: "argument",
            context: { premise, script },
          }),
        }
      );

      if (!response.ok) throw new Error("Erro na geração");
      
      const data = await response.json();
      setText(data.content);
      toast.success("Argumento gerado!");
    } catch (error) {
      toast.error("Erro ao gerar argumento");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({ text });
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Argumento</CardTitle>
          <CardDescription>
            O argumento expande sua premissa em aproximadamente 1 página completa (250-400 palavras), desenvolvendo os personagens e a estrutura narrativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Desenvolva sua premissa em um argumento completo..."
            rows={15}
            className="resize-none font-serif"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {wordCount} palavras
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Gerando..." : "Gerar com IA"}
              </Button>
              <Button onClick={handleSave} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {text && (
                <Button variant="ghost">
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
