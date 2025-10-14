import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Video, Sparkles } from "lucide-react";

interface Scene {
  id: string;
  scene_number: number;
  location: string;
  description: string;
}

interface TechnicalBreakdown {
  id: string;
  scene_id: string;
  shot_number: string | null;
  shot_type: string | null;
  framing: string | null;
  movement: string | null;
  lens: string | null;
  equipment: string[] | null;
  lighting_setup: string | null;
  sound_notes: string | null;
  vfx_notes: string | null;
  estimated_setup_time: number | null;
  notes: string | null;
}

interface BreakdownTabProps {
  projectId: string;
}

export const BreakdownTab = ({ projectId }: BreakdownTabProps) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [breakdowns, setBreakdowns] = useState<TechnicalBreakdown[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newShot, setNewShot] = useState({
    shot_number: "",
    shot_type: "",
    framing: "",
    movement: "",
    lens: "",
    equipment: "",
    lighting_setup: "",
    sound_notes: "",
    vfx_notes: "",
    estimated_setup_time: "",
    notes: "",
  });

  useEffect(() => {
    loadScenes();
  }, [projectId]);

  useEffect(() => {
    if (selectedSceneId) {
      loadBreakdowns(selectedSceneId);
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

  const loadBreakdowns = async (sceneId: string) => {
    try {
      const { data, error } = await supabase
        .from("technical_breakdown")
        .select("*")
        .eq("scene_id", sceneId)
        .order("shot_number");

      if (error) throw error;
      setBreakdowns(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar decupagem");
    }
  };

  const addShot = async () => {
    if (!selectedSceneId || !newShot.shot_number) {
      toast.error("Preencha o número do plano");
      return;
    }

    setSaving(true);
    try {
      const equipment = newShot.equipment ? newShot.equipment.split(",").map((e) => e.trim()) : null;
      const setupTime = newShot.estimated_setup_time ? parseInt(newShot.estimated_setup_time) : null;

      const { error } = await supabase.from("technical_breakdown").insert({
        scene_id: selectedSceneId,
        shot_number: newShot.shot_number,
        shot_type: newShot.shot_type || null,
        framing: newShot.framing || null,
        movement: newShot.movement || null,
        lens: newShot.lens || null,
        equipment,
        lighting_setup: newShot.lighting_setup || null,
        sound_notes: newShot.sound_notes || null,
        vfx_notes: newShot.vfx_notes || null,
        estimated_setup_time: setupTime,
        notes: newShot.notes || null,
      });

      if (error) throw error;

      toast.success("Plano adicionado!");
      setNewShot({
        shot_number: "",
        shot_type: "",
        framing: "",
        movement: "",
        lens: "",
        equipment: "",
        lighting_setup: "",
        sound_notes: "",
        vfx_notes: "",
        estimated_setup_time: "",
        notes: "",
      });
      loadBreakdowns(selectedSceneId);
    } catch (error: any) {
      toast.error("Erro ao adicionar plano");
    } finally {
      setSaving(false);
    }
  };

  const deleteShot = async (id: string) => {
    try {
      const { error } = await supabase.from("technical_breakdown").delete().eq("id", id);

      if (error) throw error;
      toast.success("Plano removido");
      if (selectedSceneId) {
        loadBreakdowns(selectedSceneId);
      }
    } catch (error: any) {
      toast.error("Erro ao remover plano");
    }
  };

  const handleGenerateWithAI = async () => {
    setGenerating(true);
    try {
      toast.info("Gerando decupagem técnica com IA... Isso pode levar alguns minutos.");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-breakdown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ projectId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar decupagem");
      }
      
      const data = await response.json();
      toast.success(data.message);
      
      // Recarregar decupagem
      if (selectedSceneId) {
        loadBreakdowns(selectedSceneId);
      } else {
        loadScenes();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar decupagem");
      console.error(error);
    } finally {
      setGenerating(false);
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
          <CardTitle>Decupagem Técnica</CardTitle>
          <CardDescription>
            Você precisa criar cenas primeiro na aba Escaleta para poder fazer a decupagem.
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
          <CardTitle>Decupagem Técnica</CardTitle>
          <CardDescription>
            Planeje os planos técnicos de cada cena do seu projeto
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
          <CardTitle>Adicionar Plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número do Plano *</Label>
              <Input
                value={newShot.shot_number}
                onChange={(e) => setNewShot({ ...newShot, shot_number: e.target.value })}
                placeholder="Ex: 1A, 2B..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Tipo de Plano</Label>
              <Input
                value={newShot.shot_type}
                onChange={(e) => setNewShot({ ...newShot, shot_type: e.target.value })}
                placeholder="Ex: Plano geral, Close..."
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Enquadramento</Label>
              <Input
                value={newShot.framing}
                onChange={(e) => setNewShot({ ...newShot, framing: e.target.value })}
                placeholder="Ex: Simétrico..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Movimento</Label>
              <Input
                value={newShot.movement}
                onChange={(e) => setNewShot({ ...newShot, movement: e.target.value })}
                placeholder="Ex: Pan, Tilt..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Lente</Label>
              <Input
                value={newShot.lens}
                onChange={(e) => setNewShot({ ...newShot, lens: e.target.value })}
                placeholder="Ex: 50mm..."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Equipamentos (separados por vírgula)</Label>
            <Input
              value={newShot.equipment}
              onChange={(e) => setNewShot({ ...newShot, equipment: e.target.value })}
              placeholder="Ex: Steadicam, Dolly, Slider..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>Setup de Iluminação</Label>
            <Textarea
              value={newShot.lighting_setup}
              onChange={(e) => setNewShot({ ...newShot, lighting_setup: e.target.value })}
              placeholder="Descreva o setup de iluminação..."
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Notas de Som</Label>
              <Textarea
                value={newShot.sound_notes}
                onChange={(e) => setNewShot({ ...newShot, sound_notes: e.target.value })}
                placeholder="Observações sobre áudio..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Notas de VFX</Label>
              <Textarea
                value={newShot.vfx_notes}
                onChange={(e) => setNewShot({ ...newShot, vfx_notes: e.target.value })}
                placeholder="Efeitos visuais necessários..."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Tempo Estimado de Setup (minutos)</Label>
            <Input
              type="number"
              value={newShot.estimated_setup_time}
              onChange={(e) => setNewShot({ ...newShot, estimated_setup_time: e.target.value })}
              placeholder="Ex: 30"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Notas Gerais</Label>
            <Textarea
              value={newShot.notes}
              onChange={(e) => setNewShot({ ...newShot, notes: e.target.value })}
              placeholder="Observações adicionais..."
              className="mt-2"
            />
          </div>

          <Button onClick={addShot} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Plano
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {breakdowns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Planos da Cena</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdowns.map((shot) => (
                <div key={shot.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Plano {shot.shot_number}</span>
                      {shot.shot_type && <span className="text-sm text-muted-foreground">({shot.shot_type})</span>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteShot(shot.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {shot.framing && <p>Enquadramento: {shot.framing}</p>}
                    {shot.movement && <p>Movimento: {shot.movement}</p>}
                    {shot.lens && <p>Lente: {shot.lens}</p>}
                  </div>
                  {shot.equipment && shot.equipment.length > 0 && (
                    <p className="text-sm">Equipamentos: {shot.equipment.join(", ")}</p>
                  )}
                  {shot.lighting_setup && (
                    <p className="text-sm"><strong>Iluminação:</strong> {shot.lighting_setup}</p>
                  )}
                  {shot.estimated_setup_time && (
                    <p className="text-xs text-muted-foreground">Tempo de setup: {shot.estimated_setup_time} min</p>
                  )}
                  {shot.notes && (
                    <p className="text-sm italic">{shot.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleGenerateWithAI} 
            disabled={generating || scenes.length === 0}
            className="w-full bg-gradient-to-r from-primary to-secondary"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? "Gerando Decupagem..." : "Gerar Decupagem com IA"}
          </Button>
          {scenes.length === 0 && (
            <p className="text-xs text-destructive text-center mt-2">
              Crie a escaleta primeiro para gerar a decupagem técnica
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
