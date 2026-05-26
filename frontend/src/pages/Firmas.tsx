import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { companiesAPI } from '@/lib/api';
import FirmaForm from '@/components/forms/FirmaForm';
import { toast } from 'sonner';

export default function Firmas() {
  const [firmas, setFirmas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const totalFirmas = firmas.length;
  const comCnpj = firmas.filter((item) => item.document || item.documento).length;
  const semCnpj = totalFirmas - comCnpj;
  const filteredFirmas = firmas.filter((firma) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return true;
    }
    const content = `${firma.name ?? ''} ${firma.document ?? ''} ${firma.city ?? ''} ${firma.contact ?? ''}`.toLowerCase();
    return content.includes(term);
  });

  const formatCnpj = (value?: string) => {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 14);
    if (digits.length !== 14) {
      return value ?? '';
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  useEffect(() => {
    loadFirmas();
  }, []);

  const loadFirmas = async () => {
    setIsLoading(true);
    try {
      const data = await companiesAPI.list();
      setFirmas(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar firmas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (companyId: number) => {
    try {
      await companiesAPI.delete(companyId);
      setFirmas((prev) => prev.filter((item) => item.id !== companyId));
      toast.success('Firma excluida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir firma:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir firma');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Firmas
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestão de firmas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Controle CNPJ e dados das firmas parceiras.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nova Firma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova firma</DialogTitle>
              </DialogHeader>
              <FirmaForm
                onSuccess={() => {
                  setOpenCreate(false);
                  loadFirmas();
                }}
                onCancel={() => undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de firmas
            </CardTitle>
            <span className="text-xs font-semibold text-muted-foreground">BASE</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFirmas}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastros ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com CNPJ
            </CardTitle>
            <span className="text-xs font-semibold text-emerald-600">OK</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comCnpj}</div>
            <p className="text-xs text-muted-foreground mt-1">Informado</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem CNPJ
            </CardTitle>
            <span className="text-xs font-semibold text-amber-600">ATENÇÃO</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semCnpj}</div>
            <p className="text-xs text-muted-foreground mt-1">Atualizar cadastro</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de Firmas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consulte dados e gerencie ações rapidamente.
            </p>
          </div>
          <Input
            placeholder="Buscar por firma, CNPJ, cidade ou contato..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredFirmas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma firma cadastrada.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_1fr_1fr_160px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Firma</span>
                <span className="text-center">CNPJ</span>
                <span>Cidade</span>
                <span className="text-right">Acoes</span>
              </div>
              {filteredFirmas.map((firma) => (
                <div
                  key={firma.id}
                  className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_1fr_1fr_160px]"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">{firma.name ?? firma.nome}</p>
                    <p className="text-sm text-muted-foreground">{firma.contact ?? 'Sem contato'}</p>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {firma.document ?? firma.documento
                      ? `${formatCnpj(firma.document ?? firma.documento)}`
                      : 'Sem CNPJ'}
                    {firma.state_registration ? ` · IE: ${firma.state_registration}` : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {firma.city ?? 'Sem cidade'}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Dialog open={openView && selected?.id === firma.id} onOpenChange={setOpenView}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(firma);
                            setOpenView(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da firma</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Nome:</strong> {selected.name}</p>
                            <p>
                              <strong>CNPJ:</strong>{' '}
                              {selected.document ?? selected.documento ?? 'Sem CNPJ'}
                            </p>
                            {selected.state_registration && (
                              <p><strong>Inscricao estadual:</strong> {selected.state_registration}</p>
                            )}
                            <p><strong>Cidade:</strong> {selected.city ?? 'Sem cidade'}</p>
                            <p><strong>Contato:</strong> {selected.contact ?? 'Sem contato'}</p>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openEdit && selected?.id === firma.id} onOpenChange={setOpenEdit}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(firma);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar firma</DialogTitle>
                        </DialogHeader>
                        <FirmaForm
                          companyId={firma.id}
                          initialValues={{
                            nome: firma.name ?? '',
                            documento: firma.document ?? '',
                            cidade: firma.city ?? '',
                            contato: firma.contact ?? '',
                          }}
                          onSuccess={() => {
                            setOpenEdit(false);
                            loadFirmas();
                          }}
                          onCancel={() => setOpenEdit(false)}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir firma</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(firma.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
