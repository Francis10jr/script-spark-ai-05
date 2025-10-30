import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, DollarSign, Edit } from "lucide-react";

interface BudgetItem {
  id: string;
  category: string;
  subcategory: string | null;
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  currency: string;
  supplier: string | null;
  contact: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
}

interface BudgetTabProps {
  projectId: string;
}

export const BudgetTab = ({ projectId }: BudgetTabProps) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    category: "",
    subcategory: "",
    item_name: "",
    description: "",
    quantity: "1",
    unit: "unidade",
    unit_price: "",
    supplier: "",
    contact: "",
    status: "estimated",
    payment_method: "",
    notes: "",
  });

  useEffect(() => {
    loadBudgetItems();
  }, [projectId]);

  const loadBudgetItems = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("project_id", projectId)
        .order("category");

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar orçamento");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.category || !newItem.item_name || !newItem.unit_price) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const quantity = parseFloat(newItem.quantity) || 1;
      const unitPrice = parseFloat(newItem.unit_price) || 0;

      const { error } = await supabase.from("budget_items").insert({
        project_id: projectId,
        category: newItem.category,
        subcategory: newItem.subcategory || null,
        item_name: newItem.item_name,
        description: newItem.description || null,
        quantity,
        unit: newItem.unit,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
        currency: "BRL",
        supplier: newItem.supplier || null,
        contact: newItem.contact || null,
        status: newItem.status,
        payment_method: newItem.payment_method || null,
        notes: newItem.notes || null,
      });

      if (error) throw error;

      toast.success("Item adicionado!");
      setNewItem({
        category: "",
        subcategory: "",
        item_name: "",
        description: "",
        quantity: "1",
        unit: "unidade",
        unit_price: "",
        supplier: "",
        contact: "",
        status: "estimated",
        payment_method: "",
        notes: "",
      });
      loadBudgetItems();
    } catch (error: any) {
      toast.error("Erro ao adicionar item");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("budget_items").delete().eq("id", id);

      if (error) throw error;
      toast.success("Item removido");
      loadBudgetItems();
    } catch (error: any) {
      toast.error("Erro ao remover item");
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const groupByCategory = () => {
    const grouped: Record<string, BudgetItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const grouped = groupByCategory();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orçamento do Projeto</CardTitle>
          <CardDescription>
            Gerencie todos os custos de produção do seu projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-2xl font-bold">
                Total: R$ {calculateTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria *</Label>
              <Input
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                placeholder="Ex: Equipe, Equipamentos, Locação..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Subcategoria</Label>
              <Input
                value={newItem.subcategory}
                onChange={(e) => setNewItem({ ...newItem, subcategory: e.target.value })}
                placeholder="Ex: Câmera, Iluminação..."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Nome do Item *</Label>
            <Input
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              placeholder="Ex: Diretor de Fotografia..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Detalhes do item..."
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="Ex: dia, hora, unidade..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Preço Unitário (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={newItem.unit_price}
                onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fornecedor</Label>
              <Input
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                placeholder="Nome do fornecedor..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Contato</Label>
              <Input
                value={newItem.contact}
                onChange={(e) => setNewItem({ ...newItem, contact: e.target.value })}
                placeholder="Telefone ou email..."
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <select
                className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                value={newItem.status}
                onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
              >
                <option value="estimated">Estimado</option>
                <option value="quoted">Cotado</option>
                <option value="approved">Aprovado</option>
                <option value="paid">Pago</option>
              </select>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Input
                value={newItem.payment_method}
                onChange={(e) => setNewItem({ ...newItem, payment_method: e.target.value })}
                placeholder="Ex: PIX, Boleto..."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={newItem.notes}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              placeholder="Notas adicionais..."
              className="mt-2"
            />
          </div>

          <Button onClick={addItem} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const categoryTotal = categoryItems.reduce((sum, item) => sum + item.total_price, 0);
            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <span className="text-lg font-semibold">
                      R$ {categoryTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.item_name}</h4>
                            {item.subcategory && (
                              <p className="text-sm text-muted-foreground">{item.subcategory}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              R$ {item.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>
                            {item.quantity} {item.unit} × R$ {item.unit_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="px-2 py-1 bg-muted rounded">{item.status}</span>
                        </div>
                        {item.supplier && (
                          <p className="text-xs">
                            <strong>Fornecedor:</strong> {item.supplier}
                            {item.contact && ` - ${item.contact}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
