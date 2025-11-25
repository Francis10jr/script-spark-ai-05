import { Film, FileText, BookOpen, ListOrdered, ScrollText, Image, Video, DollarSign, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ProjectSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  projectTitle: string;
  completedSteps: string[];
  workflowType?: "ai" | "upload" | null;
}

// Tabs para workflow com IA (ordem original)
const aiTabs = [
  { id: "premise", label: "Premissa", icon: FileText },
  { id: "argument", label: "Argumento", icon: BookOpen },
  { id: "storyline", label: "Storyline", icon: ListOrdered },
  { id: "beat_sheet", label: "Escaleta", icon: ScrollText },
  { id: "script", label: "Roteiro", icon: Film },
  { id: "storyboard", label: "Storyboard", icon: Image },
  { id: "breakdown", label: "Decupagem", icon: Video },
  { id: "budget", label: "Orçamento", icon: DollarSign },
];

// Tabs para workflow com upload (roteiro primeiro)
const uploadTabs = [
  { id: "script", label: "Roteiro", icon: Film },
  { id: "storyboard", label: "Storyboard", icon: Image },
  { id: "breakdown", label: "Decupagem", icon: Video },
  { id: "budget", label: "Orçamento", icon: DollarSign },
];

// Tabs opcionais para workflow upload
const optionalTabs = [
  { id: "premise", label: "Premissa", icon: FileText, optional: true },
  { id: "argument", label: "Argumento", icon: BookOpen, optional: true },
  { id: "storyline", label: "Storyline", icon: ListOrdered, optional: true },
  { id: "beat_sheet", label: "Escaleta", icon: ScrollText, optional: true },
];

export const ProjectSidebar = ({
  currentTab,
  onTabChange,
  projectTitle,
  completedSteps,
  workflowType,
}: ProjectSidebarProps) => {
  // Seleciona as tabs baseado no workflow
  const mainTabs = workflowType === "upload" ? uploadTabs : aiTabs;
  const showOptionalTabs = workflowType === "upload";

  return (
    <div className="w-64 border-r bg-sidebar h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Film className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-sm truncate">{projectTitle}</h2>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Main tabs */}
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isCompleted = completedSteps.includes(tab.id);
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 relative",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{tab.label}</span>
              {isCompleted && !isActive && (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              )}
            </Button>
          );
        })}

        {/* Optional tabs for upload workflow */}
        {showOptionalTabs && (
          <>
            <div className="pt-4 pb-2 px-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Opcionais com IA
              </p>
            </div>
            {optionalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              const isCompleted = completedSteps.includes(tab.id);
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative opacity-70",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground opacity-100"
                  )}
                  onClick={() => onTabChange(tab.id)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </Button>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
};
