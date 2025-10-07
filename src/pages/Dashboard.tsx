import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Film, Plus, FolderOpen, LogOut, Clock, Sparkles } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    genre: "",
    format: "",
    initialIdea: "",
  });

  useEffect(() => {
    checkUser();
    loadProjects();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.genre || !newProject.format) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          title: newProject.title,
          genre: newProject.genre,
          format: newProject.format,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Projeto criado!");
      setDialogOpen(false);
      navigate(`/projeto/${data.id}`);
    } catch (error: any) {
      toast.error("Erro ao criar projeto");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">CineIA</h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                  <DialogDescription>
                    Preencha as informações básicas do seu projeto
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Nome do Projeto *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: O Último Detetive"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gênero *</Label>
                    <Select onValueChange={(value) => setNewProject({ ...newProject, genre: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="comedia">Comédia</SelectItem>
                        <SelectItem value="terror">Terror</SelectItem>
                        <SelectItem value="acao">Ação</SelectItem>
                        <SelectItem value="ficcao">Ficção Científica</SelectItem>
                        <SelectItem value="documentario">Documentário</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Formato *</Label>
                    <Select onValueChange={(value) => setNewProject({ ...newProject, format: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curta">Curta-metragem</SelectItem>
                        <SelectItem value="longa">Longa-metragem</SelectItem>
                        <SelectItem value="serie">Série TV</SelectItem>
                        <SelectItem value="web">Web Série</SelectItem>
                        <SelectItem value="videoclipe">Videoclipe</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea">Ideia Inicial (opcional)</Label>
                    <Textarea
                      id="idea"
                      placeholder="Ex: Um detetive aposentado precisa resolver um último caso..."
                      value={newProject.initialIdea}
                      onChange={(e) => setNewProject({ ...newProject, initialIdea: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateProject} className="flex-1 bg-gradient-to-r from-primary to-secondary">
                    Criar Projeto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meus Projetos</h2>
          <p className="text-muted-foreground">Gerencie seus roteiros e produções</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Total de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{projects.length}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Gerações IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">0</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Tempo Economizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">0h</p>
            </CardContent>
          </Card>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhum projeto ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro projeto e comece a transformar ideias em roteiros profissionais
              </p>
              <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/projeto/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {project.genre && (
                      <Badge variant="secondary">{project.genre}</Badge>
                    )}
                    {project.format && (
                      <Badge variant="outline">{project.format}</Badge>
                    )}
                    <Badge
                      variant={
                        project.status === "draft" ? "default" :
                        project.status === "in_progress" ? "secondary" : "outline"
                      }
                    >
                      {project.status === "draft" ? "Rascunho" :
                       project.status === "in_progress" ? "Em andamento" : "Finalizado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
