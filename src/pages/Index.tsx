import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Film, FileText, Image, DollarSign, ArrowRight, Sparkles, Check } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: "Roteiros em minutos",
      description: "IA cria estruturas narrativas completas seguindo padrões profissionais",
    },
    {
      icon: Image,
      title: "Storyboards automáticos",
      description: "Visualize suas cenas com frames gerados automaticamente",
    },
    {
      icon: DollarSign,
      title: "Orçamentos precisos",
      description: "Calcule custos de produção baseados em sua escaleta",
    },
  ];

  const steps = [
    "Conte sua ideia",
    "IA cria a estrutura",
    "Refine e ajuste",
    "Exporte tudo pronto",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">CineIA</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Entrar
          </Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Transforme suas ideias em
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {" "}roteiros profissionais
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma completa para pré-produção audiovisual. Da premissa ao orçamento, tudo em um só lugar com auxílio de inteligência artificial.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 bg-card/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground mb-12">Simples, rápido e profissional</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-lg mb-3">
                      {index + 1}
                    </div>
                    <p className="font-medium">{step}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-secondary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Pronto para criar?</h2>
            <p className="text-lg text-muted-foreground">
              Junte-se a centenas de roteiristas e produtores que já transformaram suas ideias em projetos profissionais
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CineIA</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Sobre</a>
              <a href="#" className="hover:text-primary transition-colors">Contato</a>
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
