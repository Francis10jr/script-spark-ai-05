import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Save, Copy } from "lucide-react";

interface PremiseTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  script?: string;
}

export const PremiseTab = ({ content, onSave, projectId, script }: PremiseTabProps) => {
  const [text, setText] = useState(content?.text || "");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
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
            type: "premise",
            context: { script },
          }),
        }
      );

      if (!response.ok) throw new Error("Erro na geração");
      
      const data = await response.json();
      setText(data.content);
      toast.success("Premissa gerada!");
    } catch (error) {
      toast.error("Erro ao gerar premissa");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({ text });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Premissa</CardTitle>
          <CardDescription>
            A premissa é a essência da sua história em 2-3 linhas. Ela deve capturar o conflito principal e o que torna sua história única.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Um detetive aposentado é forçado a investigar o assassinato de seu ex-parceiro, descobrindo uma conspiração que vai além do departamento de polícia."
            rows={6}
            className="resize-none"
          />
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
              <Button onClick={handleCopy} variant="ghost">
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
