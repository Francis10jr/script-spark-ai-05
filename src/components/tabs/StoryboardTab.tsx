import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";

interface Scene {
  id: string;
  scene_number: number;
  location: string;
  description: string;
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
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFrame, setNewFrame] = useState({
    description: "",
    image_prompt: "",
    camera_angle: "",
    camera_movement: "",
  });

  useEffect(() => {
    loadScenes();
  }, [projectId]);

  useEffect(() => {
    if (selectedSceneId) {
      loadStoryboards(selectedSceneId);
    }
  }, [selectedSceneId]);

  const loadScenes = async () => {
    try {
      const { data, error } = await supabase
        .from("scenes")
        .select("id, scene_number, location, description")
        .eq("project_id", projectId)
        .order("scene_number");

      if (error) throw error;
      setScenes(data || []);
      if (data && data.length > 0 && !selectedSceneId) {
        setSelectedSceneId(data[0].id);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar cenas");
    } finally {
      setLoading(false);
    }
  };

  const loadStoryboards = async (sceneId: string) => {
    try {
      const { data, error } = await supabase
        .from("storyboards")
        .select("*")
        .eq("scene_id", sceneId)
        .order("frame_number");

      if (error) throw error;
      setStoryboards(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar storyboards");
    }
  };

  const addFrame = async () => {
    if (!selectedSceneId || !newFrame.description) {
      toast.error("Preencha a descrição do quadro");
      return;
    }

    setSaving(true);
    try {
      const nextFrameNumber = storyboards.length + 1;
      
      const { error } = await supabase.from("storyboards").insert({
        scene_id: selectedSceneId,
        frame_number: nextFrameNumber,
        description: newFrame.description,
        image_prompt: newFrame.image_prompt,
        camera_angle: newFrame.camera_angle,
        camera_movement: newFrame.camera_movement,
      });

      if (error) throw error;

      toast.success("Quadro adicionado!");
      setNewFrame({
        description: "",
        image_prompt: "",
        camera_angle: "",
        camera_movement: "",
      });
      loadStoryboards(selectedSceneId);
    } catch (error: any) {
      toast.error("Erro ao adicionar quadro");
    } finally {
      setSaving(false);
    }
  };

  const deleteFrame = async (id: string) => {
    try {
      const { error } = await supabase.from("storyboards").delete().eq("id", id);

      if (error) throw error;
      toast.success("Quadro removido");
      if (selectedSceneId) {
        loadStoryboards(selectedSceneId);
      }
    } catch (error: any) {
      toast.error("Erro ao remover quadro");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storyboard</CardTitle>
          <CardDescription>
            Você precisa criar cenas primeiro na aba Escaleta para poder adicionar storyboards.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storyboard</CardTitle>
          <CardDescription>
            Visualize e planeje os quadros de cada cena do seu projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione uma cena</Label>
            <select
              className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
              value={selectedSceneId || ""}
              onChange={(e) => setSelectedSceneId(e.target.value)}
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  Cena {scene.scene_number} - {scene.location}
                </option>
              ))}
            </select>
          </div>

          {selectedScene && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{selectedScene.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Quadro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Descrição do Quadro *</Label>
            <Textarea
              value={newFrame.description}
              onChange={(e) => setNewFrame({ ...newFrame, description: e.target.value })}
              placeholder="Descreva o que acontece neste quadro..."
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ângulo de Câmera</Label>
              <Input
                value={newFrame.camera_angle}
                onChange={(e) => setNewFrame({ ...newFrame, camera_angle: e.target.value })}
                placeholder="Ex: Close-up, Plano médio..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Movimento de Câmera</Label>
              <Input
                value={newFrame.camera_movement}
                onChange={(e) => setNewFrame({ ...newFrame, camera_movement: e.target.value })}
                placeholder="Ex: Pan, Tilt, Tracking..."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Prompt para Imagem (opcional)</Label>
            <Textarea
              value={newFrame.image_prompt}
              onChange={(e) => setNewFrame({ ...newFrame, image_prompt: e.target.value })}
              placeholder="Descrição para gerar imagem do quadro..."
              className="mt-2"
            />
          </div>

          <Button onClick={addFrame} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Quadro
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {storyboards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quadros da Cena</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {storyboards.map((frame) => (
                <div key={frame.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Quadro {frame.frame_number}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFrame(frame.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm">{frame.description}</p>
                  {(frame.camera_angle || frame.camera_movement) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {frame.camera_angle && <p>Ângulo: {frame.camera_angle}</p>}
                      {frame.camera_movement && <p>Movimento: {frame.camera_movement}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
