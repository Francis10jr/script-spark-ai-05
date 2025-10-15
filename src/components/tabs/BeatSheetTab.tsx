import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Save, Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

interface Scene {
  id: string;
  number: number;
  intExt: "INT" | "EXT";
  location: string;
  dayNight: "DIA" | "NOITE" | "ENTARDECER" | "AMANHECER";
  description: string;
  characters: string[];
  duration: number;
}

interface BeatSheetTabProps {
  content: any;
  onSave: (data: any) => void;
  projectId: string;
  storyline?: any;
}

export const BeatSheetTab = ({ content, onSave, projectId, storyline }: BeatSheetTabProps) => {
  const [scenes, setScenes] = useState<Scene[]>(content?.scenes || []);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Buscar o roteiro completo do banco
      const { data: scriptData, error: scriptError } = await supabase
        .from("scripts")
        .select("content")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (scriptError || !scriptData?.content) {
        toast.error("Nenhum roteiro encontrado. Faça upload ou gere um roteiro primeiro.");
        return;
      }

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
            context: { 
              script: scriptData.content 
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na geração");
      }
      
      const data = await response.json();
      const generatedScenes = JSON.parse(data.content);
      setScenes(generatedScenes);
      toast.success(`${generatedScenes.length} cenas geradas com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao gerar escaleta:", error);
      toast.error(error.message || "Erro ao gerar escaleta");
    } finally {
      setGenerating(false);
    }
  };

  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      number: scenes.length + 1,
      intExt: "INT",
      location: "",
      dayNight: "DIA",
      description: "",
      characters: [],
      duration: 2,
    };
    setScenes([...scenes, newScene]);
  };

  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes(scenes.map(scene => 
      scene.id === id ? { ...scene, ...updates } : scene
    ));
  };

  const deleteScene = (id: string) => {
    setScenes(scenes.filter(scene => scene.id !== id));
  };

  const moveScene = (index: number, direction: "up" | "down") => {
    const newScenes = [...scenes];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;
    
    [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];
    setScenes(newScenes.map((scene, i) => ({ ...scene, number: i + 1 })));
  };

  const handleSave = () => {
    onSave({ scenes });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Escaleta - Lista de Cenas</CardTitle>
          <CardDescription>
            Planeje todas as cenas do seu projeto em detalhes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? "Gerando..." : "Gerar Escaleta com IA"}
            </Button>
            <Button onClick={addScene} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Cena
            </Button>
            <Button onClick={handleSave} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Salvar Tudo
            </Button>
          </div>

          {scenes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma cena ainda. Gere com IA ou adicione manualmente.
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {scenes.map((scene, index) => (
                <AccordionItem key={scene.id} value={scene.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <Badge variant="outline">Cena {scene.number}</Badge>
                      <span className="font-semibold">{scene.intExt}</span>
                      <span>{scene.location || "Local não definido"}</span>
                      <Badge variant="secondary">{scene.dayNight}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium">INT/EXT</label>
                          <Select
                            value={scene.intExt}
                            onValueChange={(value: "INT" | "EXT") => 
                              updateScene(scene.id, { intExt: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INT">INT</SelectItem>
                              <SelectItem value="EXT">EXT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Local</label>
                          <Input
                            value={scene.location}
                            onChange={(e) => 
                              updateScene(scene.id, { location: e.target.value })
                            }
                            placeholder="Ex: Delegacia"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Período</label>
                          <Select
                            value={scene.dayNight}
                            onValueChange={(value) => 
                              updateScene(scene.id, { dayNight: value as any })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DIA">DIA</SelectItem>
                              <SelectItem value="NOITE">NOITE</SelectItem>
                              <SelectItem value="ENTARDECER">ENTARDECER</SelectItem>
                              <SelectItem value="AMANHECER">AMANHECER</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Descrição da Ação</label>
                        <Textarea
                          value={scene.description}
                          onChange={(e) => 
                            updateScene(scene.id, { description: e.target.value })
                          }
                          placeholder="Descreva o que acontece nesta cena..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveScene(index, "up")}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveScene(index, "down")}
                          disabled={index === scenes.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScene(scene.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
