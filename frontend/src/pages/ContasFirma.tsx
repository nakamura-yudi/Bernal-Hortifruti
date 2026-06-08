import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CheckCircle2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { contasFirmaAPI, companiesAPI, cargasAPI } from '@/lib/api';
import { toast } from 'sonner';

type ContaFirma = {
  id: number;
  firma_id: number;
  firma: { id: number; name: string };
  carga_id: number | null;
  carga: { id: number; load_date: string } | null;
  descricao: string | null;
  valor_total: number;
  data_emissao: string;
  data_pagamento: string | null;
  observacao: string | null;
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatusBadge({ pago }: { pago: boolean }) {
  return pago
    ? <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>
    : <Badge className="bg-red-100 text-red-800 border-red-200">Pendente</Badge>;
}

export default function ContasFirma() {
  const [contas, setContas] = useState<ContaFirma[]>([]);
  const [firmas, setFirmas] = useState<any[]>([]);
  const [cargas, setCargas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [firmaFiltro, setFirmaFiltro] = useState('');
  const [dataDe, setDataDe] = useState('');
  const [dataAte, setDataAte] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  // Dialog pagar
  const [pagarConta, setPagarConta] = useState<ContaFirma | null>(null);
  const [dataPagamento, setDataPagamento] = useState('');

  // Dialog gerar contas
  const [openGerar, setOpenGerar] = useState(false);
  const [cargaSelecionada, setCargaSelecionada] = useState('');
  const [gerandoContas, setGerandoContas] = useState(false);

  useEffect(() => {
    loadContas();
    companiesAPI.list().then((d: any) => setFirmas(Array.isArray(d) ? d : []));
    cargasAPI.list().then((d: any) => setCargas(Array.isArray(d) ? d : []));
  }, []);

  const loadContas = async (params?: any) => {
    setIsLoading(true);
    try {
      const data = await contasFirmaAPI.list(params);
      setContas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    loadContas({
      firma_id: firmaFiltro || undefined,
      data_de: dataDe || undefined,
      data_ate: dataAte || undefined,
      status: statusFiltro || undefined,
    });
  };

  const limparFiltros = () => {
    setFirmaFiltro('');
    setDataDe('');
    setDataAte('');
    setStatusFiltro('');
    loadContas();
  };

  const handlePagar = async () => {
    if (!pagarConta || !dataPagamento) return;
    try {
      const updated = await contasFirmaAPI.pagar(pagarConta.id, dataPagamento);
      setContas((prev) => prev.map((c) => (c.id === pagarConta.id ? { ...c, ...updated } : c)));
      toast.success('Conta marcada como paga!');
      setPagarConta(null);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erro ao marcar como paga');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await contasFirmaAPI.delete(id);
      setContas((prev) => prev.filter((c) => c.id !== id));
      toast.success('Conta excluída!');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erro ao excluir conta');
    }
  };

  const handleGerar = async () => {
    if (!cargaSelecionada) return;
    setGerandoContas(true);
    try {
      const result = await contasFirmaAPI.gerar(Number(cargaSelecionada));
      toast.success(`${result.criadas} conta(s) gerada(s)${result.ignoradas ? `, ${result.ignoradas} já existiam` : ''}.`);
      setOpenGerar(false);
      setCargaSelecionada('');
      loadContas();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erro ao gerar contas');
    } finally {
      setGerandoContas(false);
    }
  };

  const totalPendente = contas.filter((c) => !c.data_pagamento).reduce((s, c) => s + c.valor_total, 0);
  const totalPago = contas.filter((c) => c.data_pagamento).reduce((s, c) => s + c.valor_total, 0);
  const qtdPendente = contas.filter((c) => !c.data_pagamento).length;
  const qtdPago = contas.filter((c) => c.data_pagamento).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contas por Firma</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Valores de fretes cobrados por firma — gerados a partir das cargas
          </p>
        </div>
        <Button onClick={() => setOpenGerar(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Gerar Contas
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalPendente)}</p>
            <p className="text-xs text-muted-foreground">{qtdPendente} conta(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPago)}</p>
            <p className="text-xs text-muted-foreground">{qtdPago} conta(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatCurrency(totalPendente + totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{contas.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Firma</label>
              <Select value={firmaFiltro} onValueChange={setFirmaFiltro}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as firmas" />
                </SelectTrigger>
                <SelectContent>
                  {firmas.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">De</label>
              <Input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} className="w-40" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Até</label>
              <Input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} className="w-40" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">Status</label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={aplicarFiltros} className="self-end">
              <RefreshCw className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
            {(firmaFiltro || dataDe || dataAte || statusFiltro) && (
              <Button variant="ghost" onClick={limparFiltros} className="self-end text-muted-foreground">
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Carregando...</p>
          ) : contas.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhuma conta encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Firma</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carga</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emissão</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pagamento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contas.map((conta) => (
                    <tr key={conta.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{conta.firma.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {conta.carga ? `#${conta.carga.id} — ${formatDate(conta.carga.load_date)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{conta.descricao ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(conta.valor_total)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(conta.data_emissao)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(conta.data_pagamento)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge pago={!!conta.data_pagamento} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!conta.data_pagamento && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Marcar como paga"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => { setPagarConta(conta); setDataPagamento(new Date().toISOString().split('T')[0]); }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Excluirá a conta de <strong>{conta.firma.name}</strong> no valor de{' '}
                                  {formatCurrency(conta.valor_total)}. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(conta.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Marcar como Paga */}
      <Dialog open={!!pagarConta} onOpenChange={(o) => !o && setPagarConta(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como Paga</DialogTitle>
          </DialogHeader>
          {pagarConta && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Firma: <strong>{pagarConta.firma.name}</strong><br />
                Valor: <strong>{formatCurrency(pagarConta.valor_total)}</strong>
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Data de Pagamento</label>
                <Input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setPagarConta(null)}>Cancelar</Button>
                <Button onClick={handlePagar} disabled={!dataPagamento}>Confirmar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Gerar Contas */}
      <Dialog open={openGerar} onOpenChange={setOpenGerar}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerar Contas por Carga</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione uma carga para gerar automaticamente uma conta por firma com base nos fretes registrados.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Carga</label>
              <Select value={cargaSelecionada} onValueChange={setCargaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a carga" />
                </SelectTrigger>
                <SelectContent>
                  {cargas.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      Carga #{c.id} — {formatDate(c.load_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setOpenGerar(false); setCargaSelecionada(''); }}>
                Cancelar
              </Button>
              <Button onClick={handleGerar} disabled={!cargaSelecionada || gerandoContas}>
                {gerandoContas ? 'Gerando...' : 'Gerar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
