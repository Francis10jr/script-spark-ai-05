import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload } from "lucide-react";

interface WorkflowSelectorProps {
  onSelect: (type: "ai" | "upload") => void;
}

export const WorkflowSelector = ({ onSelect }: WorkflowSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Como você quer criar seu projeto?</h1>
          <p className="text-muted-foreground">
            Escolha o método que melhor se adapta ao seu fluxo de trabalho
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opção 1: Gerar com IA */}
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Gerar Tudo com IA</CardTitle>
              <CardDescription>
                Crie seu roteiro do zero com ajuda da inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Você irá criar:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Premissa</li>
                  <li>• Argumento</li>
                  <li>• Storyline</li>
                  <li>• Escaleta</li>
                  <li>• Roteiro</li>
                  <li>• Storyboard</li>
                  <li>• Decupagem técnica</li>
                  <li>• Orçamento</li>
                </ul>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => onSelect("ai")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Começar com IA
              </Button>
            </CardContent>
          </Card>

          {/* Opção 2: Upload de Roteiro */}
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle>Upload de Roteiro Pronto</CardTitle>
              <CardDescription>
                Já tem um roteiro escrito? Faça upload e continue daqui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Fluxo simplificado:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Upload do roteiro (PDF, DOCX, TXT)</li>
                  <li>• Storyboard</li>
                  <li>• Decupagem técnica</li>
                  <li>• Orçamento</li>
                </ul>
                <p className="text-xs mt-3 pt-3 border-t">
                  💡 As etapas anteriores (premissa, argumento, etc.) ficam disponíveis caso você queira gerá-las com IA
                </p>
              </div>
              <Button 
                className="w-full" 
                variant="secondary"
                size="lg"
                onClick={() => onSelect("upload")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
