import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PremiseTab } from "@/components/tabs/PremiseTab";
import { ArgumentTab } from "@/components/tabs/ArgumentTab";
import { StorylineTab } from "@/components/tabs/StorylineTab";
import { BeatSheetTab } from "@/components/tabs/BeatSheetTab";
import { ScriptTab } from "@/components/tabs/ScriptTab";
import { StoryboardTab } from "@/components/tabs/StoryboardTab";
import { BreakdownTab } from "@/components/tabs/BreakdownTab";
import { BudgetTab } from "@/components/tabs/BudgetTab";

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState("script");
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: contentData, error: contentError } = await supabase
        .from("project_content")
        .select("*")
        .eq("project_id", id);

      if (contentError) throw contentError;
      
      const contentMap = contentData.reduce((acc, item) => {
        acc[item.content_type] = item.content;
        return acc;
      }, {});
      
      setContent(contentMap);
    } catch (error: any) {
      toast.error("Erro ao carregar projeto");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (type: string, data: any) => {
    try {
      const { error } = await supabase
        .from("project_content")
        .upsert({
          project_id: id,
          content_type: type,
          content: data,
        }, {
          onConflict: 'project_id,content_type'
        });

      if (error) throw error;
      
      setContent((prev: any) => ({
        ...prev,
        [type]: data,
      }));
      
      toast.success("Conteúdo salvo!");
    } catch (error: any) {
      toast.error("Erro ao salvar");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const completedSteps = Object.keys(content).filter(
    (key) => content[key]?.text || content[key]?.scenes || content[key]?.acts
  );

  return (
    <div className="min-h-screen flex">
      <ProjectSidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        projectTitle={project?.title || "Projeto"}
        completedSteps={completedSteps}
      />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === "premise" && (
            <PremiseTab
              content={content.premise}
              onSave={(data) => saveContent("premise", data)}
              projectId={id!}
            />
          )}
          {currentTab === "argument" && (
            <ArgumentTab
              content={content.argument}
              onSave={(data) => saveContent("argument", data)}
              projectId={id!}
              premise={content.premise?.text}
            />
          )}
          {currentTab === "storyline" && (
            <StorylineTab
              content={content.storyline}
              onSave={(data) => saveContent("storyline", data)}
              projectId={id!}
              premise={content.premise?.text}
              argument={content.argument?.text}
            />
          )}
          {currentTab === "beat_sheet" && (
            <BeatSheetTab
              content={content.beat_sheet}
              onSave={(data) => saveContent("beat_sheet", data)}
              projectId={id!}
              storyline={content.storyline}
            />
          )}
          {currentTab === "script" && (
            <ScriptTab
              content={content.script}
              onSave={(data) => saveContent("script", data)}
              projectId={id!}
              beatSheet={content.beat_sheet}
            />
          )}
          {currentTab === "storyboard" && (
            <StoryboardTab projectId={id!} />
          )}
          {currentTab === "breakdown" && (
            <BreakdownTab projectId={id!} />
          )}
          {currentTab === "budget" && (
            <BudgetTab projectId={id!} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Project;
