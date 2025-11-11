import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Trash2, Camera, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Scene {
  id: string;
  scene_number: number;
  int_ext: string | null;
  location: string | null;
  time_of_day: string | null;
  description: string | null;
  characters: string[] | null;
}

interface Storyboard {
  id: string;
  scene_id: string;
  frame_number: number;
  image_url: string | null;
  image_prompt: string | null;
  description: string | null;
  camera_angle: string | null;
  camera_movement: string | null;
}

interface StoryboardTabProps {
  projectId: string;
}

export const StoryboardTab = ({ projectId }: StoryboardTabProps) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [storyboards, setStoryboards] = useState<Record<string, Storyboard[]>>({});
  const [loading, setLoading] = useState(true);
  const [generatingFrames, setGeneratingFrames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadScenes();
  }, [projectId]);

  const loadScenes = async () => {
    try {
      const { data: scenesData, error: scenesError } = await supabase
        .from("scenes" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("scene_number");

      if (scenesError) throw scenesError;
      setScenes((scenesData as any) || []);

      // Carregar storyboards existentes
      const { data: storyboardsData, error: storyboardsError } = await supabase
        .from("storyboards" as any)
        .select("*")
        .in("scene_id", ((scenesData as any) || []).map((s: any) => s.id));

      if (storyboardsError) throw storyboardsError;

      // Agrupar storyboards por scene_id
      const grouped = ((storyboardsData as any) || []).reduce((acc: any, sb: any) => {
        if (!acc[sb.scene_id]) acc[sb.scene_id] = [];
        acc[sb.scene_id].push(sb);
        return acc;
      }, {} as Record<string, Storyboard[]>);

      setStoryboards(grouped);
    } catch (error) {
      console.error("Erro ao carregar cenas:", error);
      toast.error("Erro ao carregar cenas");
    } finally {
      setLoading(false);
    }
  };

  const generateFrame = async (scene: Scene, frameData: Partial<Storyboard>) => {
    const frameKey = `${scene.id}-new`;
    setGeneratingFrames(prev => ({ ...prev, [frameKey]: true }));

    try {
      // Criar prompt baseado na cena e no frame
      const prompt = frameData.image_prompt || 
        `Cena ${scene.scene_number}: ${scene.int_ext}. ${scene.location} - ${scene.time_of_day}. ${scene.description}. 
        ${frameData.camera_angle ? `Ângulo: ${frameData.camera_angle}.` : ""} 
        ${frameData.camera_movement ? `Movimento: ${frameData.camera_movement}.` : ""}
        Estilo cinematográfico profissional, composição visual impactante.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-storyboard-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            sceneId: scene.id,
            frameNumber: (storyboards[scene.id]?.length || 0) + 1,
            cameraAngle: frameData.camera_angle,
            cameraMovement: frameData.camera_movement,
            description: frameData.description,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar frame");
      }

      const data = await response.json();
      
      // Adicionar o novo storyboard à lista
      setStoryboards(prev => ({
        ...prev,
        [scene.id]: [...(prev[scene.id] || []), data.storyboard],
      }));

      toast.success("Frame gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar frame:", error);
      toast.error(error.message || "Erro ao gerar frame");
    } finally {
      setGeneratingFrames(prev => ({ ...prev, [frameKey]: false }));
    }
  };

  const deleteFrame = async (storyboardId: string, sceneId: string) => {
    try {
      const { error } = await supabase
        .from("storyboards" as any)
        .delete()
        .eq("id", storyboardId);

      if (error) throw error;

      setStoryboards(prev => ({
        ...prev,
        [sceneId]: (prev[sceneId] || []).filter(sb => sb.id !== storyboardId),
      }));

      toast.success("Frame deletado");
    } catch (error) {
      toast.error("Erro ao deletar frame");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Storyboard</CardTitle>
            <CardDescription>
              Nenhuma cena encontrada. Crie a escaleta primeiro para gerar storyboards.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storyboard</CardTitle>
          <CardDescription>
            Gere frames visuais para cada cena do seu projeto usando IA
          </CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        {scenes.map((scene) => {
          const sceneFrames = storyboards[scene.id] || [];
          const isGenerating = generatingFrames[`${scene.id}-new`];

          return (
            <AccordionItem key={scene.id} value={scene.id}>
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">
                          Cena {scene.scene_number} - {scene.int_ext}. {scene.location}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {scene.time_of_day} • {sceneFrames.length} frame(s)
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6 pt-4">
                    <div className="text-sm text-muted-foreground">
                      {scene.description}
                    </div>

                    {/* Frames existentes */}
                    {sceneFrames.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sceneFrames.map((frame) => (
                          <Card key={frame.id} className="overflow-hidden">
                            <div className="aspect-video bg-muted relative">
                              {frame.image_url ? (
                                <img
                                  src={frame.image_url}
                                  alt={`Frame ${frame.frame_number}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2"
                                onClick={() => deleteFrame(frame.id, scene.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <CardContent className="p-4 space-y-2">
                              <div className="text-sm font-medium">
                                Frame {frame.frame_number}
                              </div>
                              {frame.camera_angle && (
                                <div className="text-xs text-muted-foreground">
                                  Ângulo: {frame.camera_angle}
                                </div>
                              )}
                              {frame.camera_movement && (
                                <div className="text-xs text-muted-foreground">
                                  Movimento: {frame.camera_movement}
                                </div>
                              )}
                              {frame.description && (
                                <div className="text-xs">{frame.description}</div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Botão para gerar novo frame */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => generateFrame(scene, {})}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGenerating ? "Gerando Frame..." : "Gerar Novo Frame"}
                      </Button>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
