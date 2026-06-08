import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Eye, Pencil, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { lotesAPI } from '@/lib/api';
import { toast } from 'sonner';

type PagamentoItem = {
  id: number;
  lote_id: number;
  produtor_id: number | null;
  produtor: { id: number; name: string } | null;
  valor: number | null;
  data_entrega: string | null;
  observacao: string | null;
};

type Lote = {
  id: number;
  firma_id: number;
  firma: { id: number; name: string };
  data_chegada: string;
  observacao: string | null;
  created_at: string;
  itens: PagamentoItem[];
};

function statusLote(itens: PagamentoItem[]) {
  if (!itens.length) return 'pendente';
  const entregues = itens.filter((i) => i.data_entrega).length;
  if (entregues === 0) return 'pendente';
  if (entregues === itens.length) return 'entregue';
  return 'parcial';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'entregue') return <Badge className="bg-green-100 text-green-800 border-green-200">Entregue</Badge>;
  if (status === 'parcial') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Parcial</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">Pendente</Badge>;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function somaItens(itens: PagamentoItem[]) {
  return itens.reduce((s, i) => s + (i.valor ?? 0), 0);
}

export default function Pagamentos() {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [markingItemId, setMarkingItemId] = useState<number | null>(null);

  useEffect(() => {
    loadLotes();
  }, []);

  const loadLotes = async () => {
    setIsLoading(true);
    try {
      const data = await lotesAPI.list();
      setLotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (loteId: number) => {
    try {
      await lotesAPI.delete(loteId);
      setLotes((prev) => prev.filter((l) => l.id !== loteId));
      toast.success('Lote excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir lote');
    }
  };

  const handleMarcarEntregue = async (lote: Lote, item: PagamentoItem) => {
    setMarkingItemId(item.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updated = await lotesAPI.updateItem(lote.id, item.id, {
        data_entrega: today,
        observacao: item.observacao,
      });
      const patch = (i: PagamentoItem) => (i.id === item.id ? { ...i, ...updated } : i);
      setLotes((prev) =>
        prev.map((l) => (l.id === lote.id ? { ...l, itens: l.itens.map(patch) } : l))
      );
      setSelectedLote((prev) =>
        prev ? { ...prev, itens: prev.itens.map(patch) } : prev
      );
      toast.success(`Pagamento marcado como entregue!`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar entrega');
    } finally {
      setMarkingItemId(null);
    }
  };

  const filtered = lotes.filter((lote) => {
    if (dateFilter && lote.data_chegada !== dateFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      lote.firma.name.toLowerCase().includes(term) ||
      lote.itens.some((i) => i.produtor?.name.toLowerCase().includes(term))
    );
  });

  const totalLotes = lotes.length;
  const totalPendentes = lotes.filter((l) => statusLote(l.itens) !== 'entregue').length;
  const totalEntregues = lotes.filter((l) => statusLote(l.itens) === 'entregue').length;
  const totalValor = lotes.reduce((sum, l) => sum + somaItens(l.itens), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Controle de pagamentos recebidos das firmas para os produtores
          </p>
        </div>
        <Button onClick={() => navigate('/pagamentos/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Lote
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total de Lotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLotes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{totalPendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Entregues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totalEntregues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatCurrency(totalValor)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por firma ou produtor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
          title="Filtrar por data de chegada"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-muted-foreground hover:text-foreground underline self-center"
          >
            Limpar data
          </button>
        )}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {search ? 'Nenhum resultado encontrado.' : 'Nenhum lote de pagamento registrado.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Firma</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de Chegada</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produtores</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((lote) => {
                    const status = statusLote(lote.itens);
                    return (
                      <tr key={lote.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{lote.firma.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(lote.data_chegada)}</td>
                        <td className="px-4 py-3">{formatCurrency(somaItens(lote.itens))}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {lote.itens.length} {lote.itens.length !== 1 ? 'produtores' : 'produtor'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedLote(lote); setOpenDetail(true); }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/pagamentos/${lote.id}/edit`)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Excluir"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir lote?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso removerá o lote de pagamento da firma{' '}
                                    <strong>{lote.firma.name}</strong> de {formatDate(lote.data_chegada)} e
                                    todos os seus {lote.itens.length} item(ns). Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(lote.id)}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhe */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLote?.firma.name} — {formatDate(selectedLote?.data_chegada)}
            </DialogTitle>
          </DialogHeader>

          {selectedLote && (
            <div className="space-y-4">
              {selectedLote.observacao && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
                  {selectedLote.observacao}
                </p>
              )}

              {selectedLote.itens.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum produtor registrado neste lote.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLote.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 border border-border rounded-lg p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.produtor?.name ?? '—'}</p>
                        {item.valor != null && (
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.valor)}</p>
                        )}
                        {item.observacao && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.observacao}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.data_entrega ? (
                          <div className="flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">{formatDate(item.data_entrega)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 text-yellow-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-medium">Pendente</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={markingItemId === item.id}
                              onClick={() => handleMarcarEntregue(selectedLote, item)}
                            >
                              {markingItemId === item.id ? 'Salvando...' : 'Marcar Entregue'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(somaItens(selectedLote.itens))}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
