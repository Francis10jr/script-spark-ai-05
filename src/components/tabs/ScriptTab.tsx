import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Save, FileDown, Upload, FileText, Loader2, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/integrations/supabase/client";

interface ScriptTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  beatSheet?: any;
}

export const ScriptTab = ({ content, onSave, projectId, beatSheet }: ScriptTabProps) => {
  const [text, setText] = useState(content?.text || "");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [source, setSource] = useState<"ai" | "upload" | null>(content?.source || null);
  const [fileName, setFileName] = useState<string | null>(content?.fileName || null);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configure PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
      setSource("ai");
      setFileName(null);
      toast.success("Roteiro gerado!");
    } catch (error) {
      toast.error("Erro ao gerar roteiro");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    onSave({ text, source, fileName });
    toast.success("Roteiro salvo!");

    // Se foi upload, gerar automaticamente escaleta para popular scenes
    if (source === 'upload') {
      toast.info("Gerando escaleta automaticamente a partir do roteiro...");
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
              type: "beat_sheet",
              context: { script: text },
            }),
          }
        );

        if (!response.ok) throw new Error("Erro na geração da escaleta");
        
        const data = await response.json();
        let generatedScenes = data.content;
        
        // Remove markdown code blocks se existirem
        if (typeof generatedScenes === 'string') {
          generatedScenes = generatedScenes.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          generatedScenes = JSON.parse(generatedScenes);
        }

        // Salvar escaleta no project_content
        const { error: contentError } = await supabase
          .from("project_content")
          .upsert({
            project_id: projectId,
            content_type: "beat_sheet",
            content: { scenes: generatedScenes },
          }, {
            onConflict: 'project_id,content_type'
          });

        if (contentError) throw contentError;

        // Popular tabela scenes
        await supabase
          .from("scenes")
          .delete()
          .eq("project_id", projectId);

        const scenesToInsert = generatedScenes.map((scene: any, index: number) => ({
          project_id: projectId,
          scene_number: scene.number,
          int_ext: scene.intExt,
          location: scene.location,
          time_of_day: scene.dayNight,
          description: scene.description,
          characters: scene.characters || [],
          estimated_duration: scene.duration,
          order_position: index + 1,
        }));

        const { error: scenesError } = await supabase
          .from("scenes")
          .insert(scenesToInsert);

        if (scenesError) throw scenesError;

        toast.success("Escaleta gerada! Agora você pode criar storyboards e decupagem.");
      } catch (error) {
        console.error("Erro ao gerar escaleta:", error);
        toast.error("Erro ao gerar escaleta automaticamente. Você pode gerá-la manualmente na aba Escaleta.");
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    // Validate file type
    const validExtensions = [".pdf", ".docx", ".txt", ".fountain"];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Formato não suportado. Use: PDF, DOCX, TXT ou Fountain");
      return;
    }

    setUploading(true);
    try {
      let extractedText = "";

      if (fileExtension === ".pdf") {
        extractedText = await extractTextFromPDF(file);
      } else if (fileExtension === ".docx") {
        extractedText = await extractTextFromDOCX(file);
      } else {
        // TXT or Fountain
        extractedText = await file.text();
      }

      setText(extractedText);
      setSource("upload");
      setFileName(file.name);
      toast.success("Roteiro carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText;
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleReset = () => {
    setText("");
    setSource(null);
    setFileName(null);
  };

  const handleExportPDF = async () => {
    const input = printRef.current;
    if (!input) {
      toast.error("Erro ao encontrar conteúdo para exportar.");
      return;
    }

    toast.info("Gerando PDF...");

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("roteiro.pdf");
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Ocorreu um erro ao gerar o PDF.");
    }
  };

  const estimatedPages = Math.ceil(text.length / 1800);

  return (
    <>
      {/* Elemento para impressão */}
      <div
        ref={printRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "800px",
          padding: "40px",
          backgroundColor: "white",
          color: "black",
        }}
      >
        <pre className="font-mono text-sm whitespace-pre-wrap">{text}</pre>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {!text ? (
          // Estado vazio - mostrar opções lado a lado
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Escolha como criar seu roteiro</h2>
              <p className="text-muted-foreground">Gere automaticamente com IA ou faça upload do seu roteiro pronto</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Opção 1: Gerar com IA */}
              <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <CardTitle>Gerar com IA</CardTitle>
                  </div>
                  <CardDescription>
                    Crie um roteiro automaticamente baseado na sua escaleta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    A IA irá gerar um roteiro completo com cenas, diálogos e descrições profissionais.
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !beatSheet?.scenes || beatSheet.scenes.length === 0}
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generating ? "Gerando..." : "Gerar Roteiro com IA"}
                  </Button>
                  {(!beatSheet?.scenes || beatSheet.scenes.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center">
                      Crie uma escaleta primeiro para gerar o roteiro
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Opção 2: Upload de Roteiro */}
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-6 h-6 text-primary" />
                    <CardTitle>Fazer Upload do Roteiro</CardTitle>
                  </div>
                  <CardDescription>
                    Já tem um roteiro pronto? Faça upload aqui
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.fountain"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm">Processando arquivo...</p>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium mb-1">
                          Arraste seu arquivo aqui ou clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formatos: PDF, DOCX, TXT, Fountain | Máx: 10MB
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Estado com roteiro - mostrar editor
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roteiro Completo</CardTitle>
                  <CardDescription>
                    Roteiro formatado profissionalmente com cenas, diálogos e descrições
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {/* Tag de origem */}
              {source && (
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      source === "ai"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/10 text-secondary-foreground"
                    }`}
                  >
                    {source === "ai" ? (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Gerado por IA
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3" />
                        Upload: {fileName}
                      </>
                    )}
                  </span>
                </div>
              )}
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
                  <Button variant="ghost" onClick={handleExportPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Substituir Roteiro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};
