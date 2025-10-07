import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Save, FileDown } from "lucide-react";

interface ScriptTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  beatSheet?: any;
}

export const ScriptTab = ({ content, onSave, projectId, beatSheet }: ScriptTabProps) => {
  const [text, setText] = useState(content?.text || "");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!beatSheet?.scenes || beatSheet.scenes.length === 0) {
      toast.error("Crie uma escaleta primeiro");
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
            type: "script",
            context: { beatSheet },
          }),
        }
      );

      if (!response.ok) throw new Error("Erro na geração");
      
      const data = await response.json();
      setText(data.content);
      toast.success("Roteiro gerado!");
    } catch (error) {
      toast.error("Erro ao gerar roteiro");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({ text });
  };

  const estimatedPages = Math.ceil(text.length / 1800);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roteiro Completo</CardTitle>
          <CardDescription>
            Roteiro formatado profissionalmente com cenas, diálogos e descrições
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Seu roteiro completo será gerado aqui..."
            rows={25}
            className="resize-none font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Aproximadamente {estimatedPages} página{estimatedPages !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Gerando..." : "Gerar Roteiro Completo com IA"}
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
