import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Download, DollarSign, Sparkles, Loader2 } from "lucide-react";
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
      const totalPrice = (formData.quantity || 1) * (formData.unit_price || 0);
      const dataToSave = {
        ...formData,
        total_price: totalPrice,
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

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      // Buscar contexto do projeto (roteiro e escaleta)
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

      const context = {
        script: scriptContent?.text || "",
        beatSheet: beatSheetContent?.scenes || beatSheetContent?.acts || [],
        scenes: scenes || [],
        scenesCount: scenes?.length || 0,
      };

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "budget",
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

      // Inserir itens no banco
      for (const item of budgetItems) {
        await supabase.from("budget_items").insert({
          project_id: projectId,
          item_name: item.item_name || item.name,
          description: item.description || null,
          category: item.category || "producao",
          subcategory: item.subcategory || null,
          quantity: item.quantity || 1,
          unit: item.unit || "unidade",
          unit_price: item.unit_price || item.unitPrice || 0,
          total_price: (item.quantity || 1) * (item.unit_price || item.unitPrice || 0),
          supplier: item.supplier || null,
          status: "estimated",
          notes: item.notes || null,
        });
      }

      toast.success(`${budgetItems.length} itens gerados com IA!`);
      loadBudgetItems();
    } catch (error: any) {
      console.error("Erro ao gerar orçamento:", error);
      toast.error(error.message || "Erro ao gerar orçamento com IA");
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={generateWithAI} disabled={generating}>
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar com IA
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
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
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Nenhum item no orçamento</p>
              <p className="text-sm mb-4">Adicione itens manualmente ou gere com IA baseado no seu roteiro.</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={generateWithAI} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar com IA
                </Button>
                <Button onClick={openNewDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                            item.status === "paid" ? "bg-green-100 text-green-700" :
                            item.status === "approved" ? "bg-blue-100 text-blue-700" :
                            item.status === "quoted" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
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
              <div className="flex justify-end mt-4">
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
