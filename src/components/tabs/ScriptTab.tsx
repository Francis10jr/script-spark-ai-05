import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Save, FileDown, Upload, FileText, CheckCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ScriptTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  beatSheet?: any;
}

export const ScriptTab = ({ content, onSave, projectId, beatSheet }: ScriptTabProps) => {
  const [text, setText] = useState(content?.text || "");
  const [generating, setGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; source: "upload" | "ai" } | null>(
    content?.text ? { name: content?.fileName || "roteiro.txt", source: content?.source || "ai" } : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadedFile({ name: "Roteiro Gerado", source: "ai" });
      toast.success("Roteiro gerado!");
    } catch (error) {
      toast.error("Erro ao gerar roteiro");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    // Validar formato
    const validFormats = ['.pdf', '.docx', '.txt', '.fountain'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validFormats.includes(fileExt)) {
      toast.error("Formato inválido. Use PDF, DOCX, TXT ou Fountain");
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }

    setProcessing(true);
    try {
      let extractedText = "";

      if (fileExt === '.txt' || fileExt === '.fountain') {
        extractedText = await file.text();
      } else if (fileExt === '.pdf') {
        // Extrair texto de PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textParts: string[] = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          textParts.push(pageText);
        }
        
        extractedText = textParts.join('\n\n');
      } else if (fileExt === '.docx') {
        // Extrair texto de DOCX
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      }

      setText(extractedText);
      setUploadedFile({ name: file.name, source: "upload" });
      
      // Salvar automaticamente
      onSave({ 
        text: extractedText, 
        fileName: file.name,
        source: "upload" 
      });
      
      toast.success("Roteiro carregado com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateAllFromUpload = async () => {
    if (!text) {
      toast.error("Nenhum roteiro carregado");
      return;
    }

    setGeneratingAll(true);
    try {
      toast.info("Gerando todo o conteúdo com IA... Isso pode levar alguns minutos.");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-uploaded-script`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            scriptText: text,
            projectId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro na geração");
      }
      
      const data = await response.json();
      toast.success("Todo o conteúdo foi gerado com sucesso! Confira as outras abas.");
      
      // Recarregar a página para atualizar todo o conteúdo
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar conteúdo");
      console.error(error);
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleReplaceScript = () => {
    setText("");
    setUploadedFile(null);
  };

  const handleSave = () => {
    onSave({ 
      text, 
      fileName: uploadedFile?.name,
      source: uploadedFile?.source 
    });
  };

  const estimatedPages = Math.ceil(text.length / 1800);

  // Estado vazio - mostrar duas opções
  if (!text && !uploadedFile) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Escolha como criar seu roteiro</h2>
          <p className="text-muted-foreground">Gere automaticamente com IA ou faça upload do seu arquivo</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opção 1: Gerar com IA */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <CardTitle>Gerar com IA</CardTitle>
              </div>
              <CardDescription>
                Crie seu roteiro automaticamente baseado na escaleta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
                <div className="text-6xl">🤖</div>
                <p className="text-sm text-muted-foreground">
                  Nossa IA irá gerar um roteiro completo e formatado profissionalmente baseado na sua escaleta
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !beatSheet?.scenes?.length}
                className="w-full bg-gradient-to-r from-primary to-secondary"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Gerando..." : "Gerar Roteiro com IA"}
              </Button>
              {!beatSheet?.scenes?.length && (
                <p className="text-xs text-destructive text-center">
                  Crie uma escaleta primeiro para gerar o roteiro
                </p>
              )}
            </CardContent>
          </Card>

          {/* Opção 2: Upload */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                <CardTitle>Fazer Upload do Roteiro</CardTitle>
              </div>
              <CardDescription>
                Já tem um roteiro pronto? Faça upload aqui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.fountain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">
                  {processing ? "Processando..." : "Arraste seu arquivo aqui"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique para selecionar
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Formatos: PDF, DOCX, TXT, Fountain</p>
                  <p>Máximo: 10MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Estado com roteiro - mostrar editor
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roteiro Completo</CardTitle>
              <CardDescription>
                Roteiro formatado profissionalmente com cenas, diálogos e descrições
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {uploadedFile && (
                <Badge variant={uploadedFile.source === "ai" ? "default" : "secondary"} className="gap-1">
                  {uploadedFile.source === "ai" ? (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Gerado por IA
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      Upload: {uploadedFile.name}
                    </>
                  )}
                </Badge>
              )}
              <div className="flex gap-2">
                {uploadedFile?.source === "upload" && (
                  <Button 
                    onClick={handleGenerateAllFromUpload} 
                    disabled={generatingAll}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    {generatingAll ? "Gerando tudo..." : "Gerar Todo Conteúdo com IA"}
                  </Button>
                )}
                <Button onClick={handleReplaceScript} variant="outline" size="sm">
                  Substituir Roteiro
                </Button>
              </div>
            </div>
          </div>
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
