import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Download, DollarSign, Sparkles, Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface BudgetItem {
  id: string;
  item_name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  supplier: string | null;
  contact: string | null;
  status: string | null;
  payment_method: string | null;
  notes: string | null;
}

interface BudgetTabProps {
  projectId: string;
}

const CATEGORIES = [
  { id: "pre_producao", label: "Pré-Produção" },
  { id: "producao", label: "Produção" },
  { id: "pos_producao", label: "Pós-Produção" },
  { id: "elenco", label: "Elenco" },
  { id: "equipe", label: "Equipe Técnica" },
  { id: "locacao", label: "Locação" },
  { id: "equipamento", label: "Equipamento" },
  { id: "arte", label: "Arte e Cenografia" },
  { id: "figurino", label: "Figurino" },
  { id: "maquiagem", label: "Maquiagem" },
  { id: "alimentacao", label: "Alimentação" },
  { id: "transporte", label: "Transporte" },
  { id: "seguro", label: "Seguro" },
  { id: "marketing", label: "Marketing" },
  { id: "contingencia", label: "Contingência" },
  { id: "outros", label: "Outros" },
];

const STATUS_OPTIONS = [
  { id: "estimated", label: "Estimado" },
  { id: "quoted", label: "Orçado" },
  { id: "approved", label: "Aprovado" },
  { id: "paid", label: "Pago" },
];

const emptyItem: Omit<BudgetItem, "id"> = {
  item_name: "",
  description: null,
  category: "producao",
  subcategory: null,
  quantity: 1,
  unit: "unidade",
  unit_price: 0,
  total_price: 0,
  supplier: null,
  contact: null,
  status: "estimated",
  payment_method: null,
  notes: null,
};

export const BudgetTab = ({ projectId }: BudgetTabProps) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState<Omit<BudgetItem, "id">>(emptyItem);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBudgetItems();
  }, [projectId]);

  const loadBudgetItems = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("project_id", projectId)
        .order("category", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
      toast.error("Erro ao carregar itens do orçamento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Não incluir total_price pois é uma coluna gerada automaticamente
      const dataToSave = {
        item_name: formData.item_name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        quantity: formData.quantity,
        unit: formData.unit,
        unit_price: formData.unit_price,
        supplier: formData.supplier,
        contact: formData.contact,
        status: formData.status,
        payment_method: formData.payment_method,
        notes: formData.notes,
        project_id: projectId,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("budget_items")
          .update(dataToSave)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Item atualizado!");
      } else {
        const { error } = await supabase
          .from("budget_items")
          .insert(dataToSave);
        if (error) throw error;
        toast.success("Item adicionado!");
      }

      setDialogOpen(false);
      setEditingItem(null);
      setFormData(emptyItem);
      loadBudgetItems();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este item?")) return;
    
    try {
      const { error } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Item excluído!");
      loadBudgetItems();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir item");
    }
  };

  const openEditDialog = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.total_price,
      supplier: item.supplier,
      contact: item.contact,
      status: item.status,
      payment_method: item.payment_method,
      notes: item.notes,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData(emptyItem);
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "text/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !["csv", "txt", "xls", "xlsx"].includes(extension || "")) {
      toast.error("Formato não suportado. Use CSV, TXT, XLS ou XLSX.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 5MB)");
      return;
    }

    setUploading(true);
    
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("Arquivo vazio ou sem itens");
        return;
      }

      // Detectar separador (vírgula, ponto-vírgula ou tab)
      const firstLine = lines[0];
      const separator = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";
      
      // Pular cabeçalho se existir
      const hasHeader = lines[0].toLowerCase().includes("item") || 
                        lines[0].toLowerCase().includes("nome") ||
                        lines[0].toLowerCase().includes("descrição");
      
      const dataLines = hasHeader ? lines.slice(1) : lines;
      
      let importedCount = 0;
      
      for (const line of dataLines) {
        const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ""));
        if (parts.length < 1 || !parts[0]) continue;
        
        // Formato esperado: Nome, Descrição (opcional), Categoria (opcional), Quantidade (opcional), Unidade (opcional), Preço Unitário (opcional)
        const itemName = parts[0];
        const description = parts[1] || null;
        const category = mapCategory(parts[2]) || "outros";
        const quantity = parseFloat(parts[3]) || 1;
        const unit = parts[4] || "unidade";
        const unitPrice = parseFloat(parts[5]?.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
        
        await supabase.from("budget_items").insert({
          project_id: projectId,
          item_name: itemName,
          description: description,
          category: category,
          quantity: quantity,
          unit: unit,
          unit_price: unitPrice,
          status: "estimated",
        });
        
        importedCount++;
      }
      
      toast.success(`${importedCount} itens importados!`);
      loadBudgetItems();
      
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const mapCategory = (input: string | undefined): string => {
    if (!input) return "outros";
    const lower = input.toLowerCase();
    
    if (lower.includes("pré") || lower.includes("pre-prod")) return "pre_producao";
    if (lower.includes("pós") || lower.includes("pos-prod") || lower.includes("post")) return "pos_producao";
    if (lower.includes("produção") || lower.includes("producao")) return "producao";
    if (lower.includes("elenco") || lower.includes("ator") || lower.includes("cast")) return "elenco";
    if (lower.includes("equipe") || lower.includes("crew") || lower.includes("técnic")) return "equipe";
    if (lower.includes("locação") || lower.includes("locacao") || lower.includes("location")) return "locacao";
    if (lower.includes("equipamento") || lower.includes("camera") || lower.includes("equipment")) return "equipamento";
    if (lower.includes("arte") || lower.includes("cenografia") || lower.includes("set")) return "arte";
    if (lower.includes("figurino") || lower.includes("costume")) return "figurino";
    if (lower.includes("maquiagem") || lower.includes("makeup")) return "maquiagem";
    if (lower.includes("alimentação") || lower.includes("catering") || lower.includes("comida")) return "alimentacao";
    if (lower.includes("transporte") || lower.includes("transport")) return "transporte";
    if (lower.includes("seguro") || lower.includes("insurance")) return "seguro";
    if (lower.includes("marketing") || lower.includes("divulgação")) return "marketing";
    if (lower.includes("contingência") || lower.includes("contingencia")) return "contingencia";
    
    return "outros";
  };

  const generateBudgetWithAI = async () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item antes de gerar o orçamento com IA");
      return;
    }

    setGenerating(true);
    try {
      // Buscar contexto do projeto
      const { data: contentData } = await supabase
        .from("project_content")
        .select("content_type, content")
        .eq("project_id", projectId);

      const scriptContent = contentData?.find(c => c.content_type === "script")?.content as { text?: string } | null;
      const beatSheetContent = contentData?.find(c => c.content_type === "beat_sheet")?.content as { scenes?: any[]; acts?: any } | null;

      const { data: scenes } = await supabase
        .from("scenes")
        .select("*")
        .eq("project_id", projectId);

      // Preparar lista de itens atuais
      const currentItems = items.map(item => ({
        name: item.item_name,
        description: item.description,
        category: CATEGORIES.find(c => c.id === item.category)?.label || item.category,
        quantity: item.quantity,
        unit: item.unit,
        current_unit_price: item.unit_price,
      }));

      const context = {
        script: scriptContent?.text || "",
        beatSheet: beatSheetContent?.scenes || beatSheetContent?.acts || [],
        scenes: scenes || [],
        scenesCount: scenes?.length || 0,
        existingItems: currentItems,
      };

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "budget_calculate",
          context,
        },
      });

      if (error) throw error;

      let budgetItems = [];
      let responseText = data.content || "";
      
      // Limpar markdown code blocks
      if (responseText.includes("```")) {
        responseText = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      }

      try {
        const parsed = JSON.parse(responseText);
        budgetItems = parsed.items || parsed;
      } catch {
        console.error("Erro ao parsear resposta:", responseText);
        throw new Error("Resposta inválida da IA");
      }

      // Atualizar itens existentes com os preços calculados pela IA
      for (const aiItem of budgetItems) {
        const existingItem = items.find(
          i => i.item_name.toLowerCase() === (aiItem.item_name || aiItem.name)?.toLowerCase()
        );

        if (existingItem) {
          const newUnitPrice = aiItem.unit_price || aiItem.unitPrice || existingItem.unit_price || 0;
          const newQuantity = aiItem.quantity || existingItem.quantity || 1;
          
          await supabase
            .from("budget_items")
            .update({
              unit_price: newUnitPrice,
              quantity: newQuantity,
              description: aiItem.description || existingItem.description,
              supplier: aiItem.supplier || existingItem.supplier,
              notes: aiItem.notes || existingItem.notes,
            })
            .eq("id", existingItem.id);
        } else {
          // Adicionar novos itens sugeridos pela IA
          await supabase.from("budget_items").insert({
            project_id: projectId,
            item_name: aiItem.item_name || aiItem.name,
            description: aiItem.description || null,
            category: mapCategory(aiItem.category) || "outros",
            quantity: aiItem.quantity || 1,
            unit: aiItem.unit || "unidade",
            unit_price: aiItem.unit_price || aiItem.unitPrice || 0,
            supplier: aiItem.supplier || null,
            status: "estimated",
            notes: aiItem.notes || null,
          });
        }
      }

      toast.success("Orçamento calculado pela IA com sucesso!");
      loadBudgetItems();
    } catch (error: any) {
      console.error("Erro ao gerar orçamento:", error);
      toast.error(error.message || "Erro ao calcular orçamento com IA");
    } finally {
      setGenerating(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ORÇAMENTO DE PRODUÇÃO", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Agrupar por categoria
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, BudgetItem[]>);

    let grandTotal = 0;

    for (const [category, categoryItems] of Object.entries(groupedItems)) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      const categoryLabel = CATEGORIES.find(c => c.id === category)?.label || category;
      
      // Categoria header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPos - 5, pageWidth - 20, 10, "F");
      doc.text(categoryLabel.toUpperCase(), 15, yPos + 2);
      yPos += 15;

      let categoryTotal = 0;

      for (const item of categoryItems) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Item name
        doc.setFont("helvetica", "bold");
        doc.text(item.item_name, 15, yPos);
        
        // Quantidade e preço
        const priceText = `${item.quantity || 1} x R$ ${(item.unit_price || 0).toFixed(2)} = R$ ${(item.total_price || 0).toFixed(2)}`;
        doc.setFont("helvetica", "normal");
        doc.text(priceText, pageWidth - 15, yPos, { align: "right" });
        yPos += 5;

        // Descrição
        if (item.description) {
          doc.setFontSize(9);
          doc.setTextColor(100);
          const descLines = doc.splitTextToSize(item.description, pageWidth - 40);
          doc.text(descLines, 20, yPos);
          yPos += descLines.length * 4;
          doc.setTextColor(0);
        }

        yPos += 5;
        categoryTotal += item.total_price || 0;
      }

      // Subtotal categoria
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Subtotal: R$ ${categoryTotal.toFixed(2)}`, pageWidth - 15, yPos, { align: "right" });
      yPos += 15;

      grandTotal += categoryTotal;
    }

    // Total geral
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(50, 50, 50);
    doc.setTextColor(255);
    doc.rect(10, yPos - 5, pageWidth - 20, 15, "F");
    doc.text(`TOTAL GERAL: R$ ${grandTotal.toFixed(2)}`, pageWidth / 2, yPos + 4, { align: "center" });

    doc.save("orcamento-producao.pdf");
    toast.success("PDF exportado!");
  };

  const totalBudget = items.reduce((acc, item) => acc + (item.total_price || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Orçamento de Produção
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportToPDF} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button 
              variant="default" 
              onClick={generateBudgetWithAI} 
              disabled={generating || items.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Calcular com IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">Adicione os itens do seu orçamento</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Adicione os itens manualmente ou faça upload de uma planilha. Depois, a IA calculará os custos detalhados.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewDialog} size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Adicionar Item Manualmente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Editar Item" : "Novo Item de Orçamento"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Nome do Item *</Label>
                          <Input
                            value={formData.item_name}
                            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                            required
                            placeholder="Ex: Aluguel de câmera RED"
                          />
                        </div>
                        <div>
                          <Label>Categoria *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(v) => setFormData({ ...formData, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={formData.status || "estimated"}
                            onValueChange={(v) => setFormData({ ...formData, status: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.quantity || 1}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Unidade</Label>
                          <Input
                            value={formData.unit || "unidade"}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="Ex: diária, unidade, hora"
                          />
                        </div>
                        <div>
                          <Label>Preço Unitário (R$) - opcional</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.unit_price || 0}
                            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                            placeholder="A IA pode calcular"
                          />
                        </div>
                        <div>
                          <Label>Fornecedor</Label>
                          <Input
                            value={formData.supplier || ""}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="Nome do fornecedor"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes sobre o item..."
                            rows={2}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Notas</Label>
                          <Textarea
                            value={formData.notes || ""}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Observações adicionais..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingItem ? "Atualizar" : "Adicionar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xls,.xlsx,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <Button variant="outline" size="lg" disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 mr-2" />
                    )}
                    Upload de Planilha
                  </Button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-lg mx-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="font-medium">Formato da planilha (CSV/TXT):</span>
                </div>
                <code className="text-xs block text-left bg-background p-2 rounded">
                  Nome, Descrição, Categoria, Quantidade, Unidade, Preço
                </code>
              </div>
            </div>
          ) : (
            <>
              {/* Action buttons for when items exist */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={openNewDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Editar Item" : "Novo Item de Orçamento"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Nome do Item *</Label>
                          <Input
                            value={formData.item_name}
                            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                            required
                            placeholder="Ex: Aluguel de câmera RED"
                          />
                        </div>
                        <div>
                          <Label>Categoria *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(v) => setFormData({ ...formData, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={formData.status || "estimated"}
                            onValueChange={(v) => setFormData({ ...formData, status: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.quantity || 1}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Unidade</Label>
                          <Input
                            value={formData.unit || "unidade"}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="Ex: diária, unidade, hora"
                          />
                        </div>
                        <div>
                          <Label>Preço Unitário (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.unit_price || 0}
                            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Fornecedor</Label>
                          <Input
                            value={formData.supplier || ""}
                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            placeholder="Nome do fornecedor"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes sobre o item..."
                            rows={2}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Notas</Label>
                          <Textarea
                            value={formData.notes || ""}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Observações adicionais..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingItem ? "Atualizar" : "Adicionar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <Button variant="outline" disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload de Planilha
                  </Button>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Unitário</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(item.unit_price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {(item.total_price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            item.status === "approved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            item.status === "quoted" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {STATUS_OPTIONS.find(s => s.id === item.status)?.label || item.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {items.length} itens • Clique em "Calcular com IA" para obter custos detalhados
                </p>
                <div className="bg-primary/10 rounded-lg px-6 py-3">
                  <p className="text-sm text-muted-foreground">Total Geral</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {totalBudget.toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
