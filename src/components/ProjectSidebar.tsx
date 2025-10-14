import { Film, FileText, BookOpen, ListOrdered, ScrollText, Image, Video, DollarSign, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ProjectSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  projectTitle: string;
  completedSteps: string[];
}

const tabs = [
  { id: "script", label: "Roteiro", icon: Film },
  { id: "premise", label: "Premissa", icon: FileText },
  { id: "argument", label: "Argumento", icon: BookOpen },
  { id: "storyline", label: "Storyline", icon: ListOrdered },
  { id: "beat_sheet", label: "Escaleta", icon: ScrollText },
  { id: "storyboard", label: "Storyboard", icon: Image },
  { id: "breakdown", label: "Decupagem", icon: Video },
  { id: "budget", label: "Orçamento", icon: DollarSign },
];

export const ProjectSidebar = ({
  currentTab,
  onTabChange,
  projectTitle,
  completedSteps,
}: ProjectSidebarProps) => {
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
        {tabs.map((tab) => {
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
      </nav>
    </div>
  );
};
