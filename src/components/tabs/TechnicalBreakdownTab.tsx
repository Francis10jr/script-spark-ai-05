import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Save, Video, Sparkles, Download } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface Shot {
  id: string;
  shot_number: string;
  shot_type: string;
  framing: string;
  movement: string;
  lens: string;
  equipment: string[];
  lighting_setup: string;
  sound_notes: string;
  vfx_notes: string;
  notes: string;
  estimated_setup_time: number;
}

interface Scene {
  id: string;
  scene_number: number;
  int_ext: string;
  location: string;
  time_of_day: string;
  description: string;
  shots: Shot[];
}

interface TechnicalBreakdownTabProps {
  projectId: string;
}

export const TechnicalBreakdownTab = ({ projectId }: TechnicalBreakdownTabProps) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenes();
  }, [projectId]);

  const loadScenes = async () => {
    try {
      const { data: scenesData, error: scenesError } = await supabase
        .from("scenes" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("order_position");

      if (scenesError) throw scenesError;

      const { data: breakdownData, error: breakdownError } = await supabase
        .from("technical_breakdown" as any)
        .select("*")
        .in("scene_id", scenesData?.map((s: any) => s.id) || []);

      if (breakdownError) throw breakdownError;

      const scenesWithShots = scenesData?.map((scene: any) => ({
        ...scene,
        shots: breakdownData?.filter((b: any) => b.scene_id === scene.id).map((b: any) => ({
          id: b.id,
          shot_number: b.shot_number || "",
          shot_type: b.shot_type || "",
          framing: b.framing || "",
          movement: b.movement || "",
          lens: b.lens || "",
          equipment: b.equipment || [],
          lighting_setup: b.lighting_setup || "",
          sound_notes: b.sound_notes || "",
          vfx_notes: b.vfx_notes || "",
          notes: b.notes || "",
          estimated_setup_time: b.estimated_setup_time || 0,
        })) || [],
      })) || [];

      setScenes(scenesWithShots);
    } catch (error) {
      console.error("Erro ao carregar cenas:", error);
      toast.error("Erro ao carregar decupagem");
    } finally {
      setLoading(false);
    }
  };

  const addShot = (sceneId: string) => {
    setScenes(scenes.map(scene => {
      if (scene.id === sceneId) {
        const newShot: Shot = {
          id: `shot-${Date.now()}`,
          shot_number: `${scene.scene_number}.${scene.shots.length + 1}`,
          shot_type: "",
          framing: "",
          movement: "",
          lens: "",
          equipment: [],
          lighting_setup: "",
          sound_notes: "",
          vfx_notes: "",
          notes: "",
          estimated_setup_time: 0,
        };
        return { ...scene, shots: [...scene.shots, newShot] };
      }
      return scene;
    }));
  };

  const updateShot = (sceneId: string, shotId: string, updates: Partial<Shot>) => {
    setScenes(scenes.map(scene => {
      if (scene.id === sceneId) {
        return {
          ...scene,
          shots: scene.shots.map(shot => 
            shot.id === shotId ? { ...shot, ...updates } : shot
          ),
        };
      }
      return scene;
    }));
  };

  const deleteShot = async (sceneId: string, shotId: string) => {
    try {
      if (!shotId.startsWith("shot-")) {
        const { error } = await supabase
          .from("technical_breakdown" as any)
          .delete()
          .eq("id", shotId);

        if (error) throw error;
      }

      setScenes(scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            shots: scene.shots.filter(shot => shot.id !== shotId),
          };
        }
        return scene;
      }));

      toast.success("Plano removido");
    } catch (error) {
      console.error("Erro ao remover plano:", error);
      toast.error("Erro ao remover plano");
    }
  };

  const saveShot = async (sceneId: string, shot: Shot) => {
    try {
      const shotData = {
        scene_id: sceneId,
        shot_number: shot.shot_number,
        shot_type: shot.shot_type,
        framing: shot.framing,
        movement: shot.movement,
        lens: shot.lens,
        equipment: shot.equipment,
        lighting_setup: shot.lighting_setup,
        sound_notes: shot.sound_notes,
        vfx_notes: shot.vfx_notes,
        notes: shot.notes,
        estimated_setup_time: shot.estimated_setup_time,
      };

      if (shot.id.startsWith("shot-")) {
        const { error } = await supabase
          .from("technical_breakdown" as any)
          .insert(shotData);

        if (error) throw error;
        
        await loadScenes();
      } else {
        const { error } = await supabase
          .from("technical_breakdown" as any)
          .update(shotData)
          .eq("id", shot.id);

        if (error) throw error;
      }

      toast.success("Plano salvo");
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      toast.error("Erro ao salvar plano");
    }
  };

  const generateShotsWithAI = async (scene: Scene) => {
    try {
      toast.loading("Gerando decupagem com IA...");
      
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "technical_breakdown",
          context: {
            scene_number: scene.scene_number,
            int_ext: scene.int_ext,
            location: scene.location,
            time_of_day: scene.time_of_day,
            description: scene.description,
          },
        },
      });

      if (error) throw error;

      // Remove markdown code blocks se existirem
      let cleanContent = data.content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
      }

      const generatedShots = JSON.parse(cleanContent);
      
      // Salva os planos gerados no banco
      const shotsToInsert = generatedShots.map((shot: any) => ({
        scene_id: scene.id,
        shot_number: shot.shot_number,
        shot_type: shot.shot_type,
        framing: shot.framing,
        movement: shot.movement,
        lens: shot.lens,
        equipment: shot.equipment,
        lighting_setup: shot.lighting_setup,
        sound_notes: shot.sound_notes,
        vfx_notes: shot.vfx_notes,
        notes: shot.notes,
        estimated_setup_time: shot.estimated_setup_time,
      }));

      const { error: insertError } = await supabase
        .from("technical_breakdown" as any)
        .insert(shotsToInsert);

      if (insertError) throw insertError;

      await loadScenes();
      toast.success(`${generatedShots.length} planos gerados com sucesso!`);
    } catch (error) {
      console.error("Erro ao gerar decupagem:", error);
      toast.error("Erro ao gerar decupagem com IA");
    } finally {
      toast.dismiss();
    }
  };

  const exportDecupagemPDF = () => {
    toast.loading("Gerando PDF da Decupagem...");
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Título
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("DECUPAGEM TÉCNICA", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      for (const scene of scenes) {
        // Verifica se precisa nova página
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        // Cabeçalho da cena
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Cena ${scene.scene_number} - ${scene.int_ext} ${scene.location}`, margin, yPos);
        yPos += 6;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${scene.time_of_day || ""}`, margin, yPos);
        yPos += 5;

        if (scene.description) {
          const descLines = pdf.splitTextToSize(scene.description, pageWidth - margin * 2);
          pdf.text(descLines, margin, yPos);
          yPos += descLines.length * 4 + 5;
        }

        // Planos da cena
        if (scene.shots.length === 0) {
          pdf.setFontSize(9);
          pdf.setTextColor(128);
          pdf.text("Nenhum plano definido", margin, yPos);
          pdf.setTextColor(0);
          yPos += 8;
        } else {
          for (const shot of scene.shots) {
            if (yPos > 260) {
              pdf.addPage();
              yPos = 20;
            }

            // Cabeçalho do plano
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text(`Plano ${shot.shot_number}`, margin, yPos);
            yPos += 5;

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");

            const col1X = margin;
            const col2X = margin + 60;
            const col3X = margin + 120;

            // Linha 1
            if (shot.shot_type) pdf.text(`Tipo: ${shot.shot_type}`, col1X, yPos);
            if (shot.framing) pdf.text(`Enquadramento: ${shot.framing}`, col2X, yPos);
            yPos += 4;

            // Linha 2
            if (shot.movement) pdf.text(`Movimento: ${shot.movement}`, col1X, yPos);
            if (shot.lens) pdf.text(`Lente: ${shot.lens}`, col2X, yPos);
            if (shot.estimated_setup_time) pdf.text(`Setup: ${shot.estimated_setup_time} min`, col3X, yPos);
            yPos += 4;

            // Equipamentos
            if (shot.equipment && shot.equipment.length > 0) {
              pdf.text(`Equipamentos: ${shot.equipment.join(", ")}`, col1X, yPos);
              yPos += 4;
            }

            // Iluminação
            if (shot.lighting_setup) {
              const lightLines = pdf.splitTextToSize(`Iluminação: ${shot.lighting_setup}`, pageWidth - margin * 2);
              pdf.text(lightLines, col1X, yPos);
              yPos += lightLines.length * 4;
            }

            // Notas de som
            if (shot.sound_notes) {
              const soundLines = pdf.splitTextToSize(`Som: ${shot.sound_notes}`, pageWidth - margin * 2);
              pdf.text(soundLines, col1X, yPos);
              yPos += soundLines.length * 4;
            }

            // VFX
            if (shot.vfx_notes) {
              const vfxLines = pdf.splitTextToSize(`VFX: ${shot.vfx_notes}`, pageWidth - margin * 2);
              pdf.text(vfxLines, col1X, yPos);
              yPos += vfxLines.length * 4;
            }

            // Notas gerais
            if (shot.notes) {
              const notesLines = pdf.splitTextToSize(`Notas: ${shot.notes}`, pageWidth - margin * 2);
              pdf.text(notesLines, col1X, yPos);
              yPos += notesLines.length * 4;
            }

            yPos += 5;
          }
        }

        yPos += 8;
      }

      pdf.save("decupagem-tecnica.pdf");
      toast.dismiss();
      toast.success("Decupagem exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.dismiss();
      toast.error("Erro ao exportar decupagem");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Decupagem Técnica</CardTitle>
            <CardDescription>
              Nenhuma cena encontrada. Crie uma escaleta primeiro.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Decupagem Técnica</CardTitle>
            <CardDescription>
              Planeje os planos e detalhes técnicos de cada cena
            </CardDescription>
          </div>
          {scenes.some(s => s.shots.length > 0) && (
            <Button onClick={exportDecupagemPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-4">
            {scenes.map((scene) => (
              <AccordionItem key={scene.id} value={scene.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <Badge variant="outline">Cena {scene.scene_number}</Badge>
                    <span className="font-semibold">{scene.int_ext}</span>
                    <span>{scene.location}</span>
                    <Badge variant="secondary">{scene.time_of_day}</Badge>
                    <Badge variant="outline">{scene.shots.length} planos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">{scene.description}</p>
                      <div className="flex gap-2">
                        {scene.shots.length === 0 && (
                          <Button
                            onClick={() => generateShotsWithAI(scene)}
                            size="sm"
                            variant="default"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerar com IA
                          </Button>
                        )}
                        <Button
                          onClick={() => addShot(scene.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Plano
                        </Button>
                      </div>
                    </div>

                    {scene.shots.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum plano criado. Adicione o primeiro plano.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scene.shots.map((shot) => (
                          <Card key={shot.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Video className="w-4 h-4" />
                                  <CardTitle className="text-base">
                                    Plano {shot.shot_number}
                                  </CardTitle>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => saveShot(scene.id, shot)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteShot(scene.id, shot.id)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium">Número do Plano</label>
                                  <Input
                                    value={shot.shot_number}
                                    onChange={(e) => updateShot(scene.id, shot.id, { shot_number: e.target.value })}
                                    placeholder="Ex: 1.1"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tipo de Plano</label>
                                  <Select
                                    value={shot.shot_type}
                                    onValueChange={(value) => updateShot(scene.id, shot.id, { shot_type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GPG">GPG - Grande Plano Geral</SelectItem>
                                      <SelectItem value="PG">PG - Plano Geral</SelectItem>
                                      <SelectItem value="PA">PA - Plano Americano</SelectItem>
                                      <SelectItem value="PM">PM - Plano Médio</SelectItem>
                                      <SelectItem value="PP">PP - Primeiro Plano</SelectItem>
                                      <SelectItem value="PPP">PPP - Primeiríssimo Plano</SelectItem>
                                      <SelectItem value="Detalhe">Detalhe</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium">Enquadramento</label>
                                  <Input
                                    value={shot.framing}
                                    onChange={(e) => updateShot(scene.id, shot.id, { framing: e.target.value })}
                                    placeholder="Ex: Frontal, Contra-plongée"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Movimento de Câmera</label>
                                  <Input
                                    value={shot.movement}
                                    onChange={(e) => updateShot(scene.id, shot.id, { movement: e.target.value })}
                                    placeholder="Ex: Travelling, Pan, Fixa"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium">Lente</label>
                                  <Input
                                    value={shot.lens}
                                    onChange={(e) => updateShot(scene.id, shot.id, { lens: e.target.value })}
                                    placeholder="Ex: 50mm, 24mm"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tempo de Setup (min)</label>
                                  <Input
                                    type="number"
                                    value={shot.estimated_setup_time}
                                    onChange={(e) => updateShot(scene.id, shot.id, { estimated_setup_time: parseInt(e.target.value) || 0 })}
                                    placeholder="Ex: 30"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Equipamentos</label>
                                <Input
                                  value={shot.equipment.join(", ")}
                                  onChange={(e) => updateShot(scene.id, shot.id, { 
                                    equipment: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                                  })}
                                  placeholder="Separe por vírgula: Steadicam, Dolly, Grua"
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Iluminação</label>
                                <Textarea
                                  value={shot.lighting_setup}
                                  onChange={(e) => updateShot(scene.id, shot.id, { lighting_setup: e.target.value })}
                                  placeholder="Descreva o setup de iluminação..."
                                  rows={2}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium">Notas de Som</label>
                                  <Textarea
                                    value={shot.sound_notes}
                                    onChange={(e) => updateShot(scene.id, shot.id, { sound_notes: e.target.value })}
                                    placeholder="Observações sobre captação de som..."
                                    rows={2}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Notas de VFX</label>
                                  <Textarea
                                    value={shot.vfx_notes}
                                    onChange={(e) => updateShot(scene.id, shot.id, { vfx_notes: e.target.value })}
                                    placeholder="Efeitos visuais necessários..."
                                    rows={2}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Observações Gerais</label>
                                <Textarea
                                  value={shot.notes}
                                  onChange={(e) => updateShot(scene.id, shot.id, { notes: e.target.value })}
                                  placeholder="Outras anotações importantes..."
                                  rows={2}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};
