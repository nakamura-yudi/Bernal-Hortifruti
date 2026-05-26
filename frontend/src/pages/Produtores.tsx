import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { produtoresAPI } from '@/lib/api';
import ProdutorForm from '@/components/forms/ProdutorForm';
import { toast } from 'sonner';

export default function Produtores() {
  const [produtores, setProdutores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const totalProdutores = produtores.length;
  const comContato = produtores.filter((item) => item.contact || item.telefone).length;
  const semContato = totalProdutores - comContato;
  const filteredProdutores = produtores.filter((produtor) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return true;
    }
    const content = `${produtor.name ?? ''} ${produtor.document ?? ''} ${produtor.city ?? ''} ${produtor.contact ?? ''}`.toLowerCase();
    return content.includes(term);
  });

  const documentLabel = (value?: string) => {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) {
      return 'Documento';
    }
    if (digits.length === 11) {
      return 'CPF';
    }
    if (digits.length === 14) {
      return 'CNPJ';
    }
    return 'Documento';
  };

  const formatCpfCnpj = (value?: string) => {
    const digits = (value ?? '').replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return value ?? '';
  };

  useEffect(() => {
    loadProdutores();
  }, []);

  const loadProdutores = async () => {
    setIsLoading(true);
    try {
      const data = await produtoresAPI.list();
      setProdutores(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (producerId: number) => {
    try {
      await produtoresAPI.delete(producerId);
      setProdutores((prev) => prev.filter((item) => item.id !== producerId));
      toast.success('Produtor excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir produtor:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir produtor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Produtores
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Base de produtores</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Mantenha cadastros e contatos sempre atualizados.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produtor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo produtor</DialogTitle>
              </DialogHeader>
              <ProdutorForm
                onSuccess={() => {
                  setOpenCreate(false);
                  loadProdutores();
                }}
                onCancel={() => setOpenCreate(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de produtores
            </CardTitle>
            <span className="text-xs font-semibold text-muted-foreground">BASE</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutores}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastros ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com contato
            </CardTitle>
            <span className="text-xs font-semibold text-emerald-600">OK</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comContato}</div>
            <p className="text-xs text-muted-foreground mt-1">Telefone ou contato</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem contato
            </CardTitle>
            <span className="text-xs font-semibold text-amber-600">ATENÇÃO</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semContato}</div>
            <p className="text-xs text-muted-foreground mt-1">Atualizar cadastro</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de Produtores</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consulte dados e gerencie ações rapidamente.
            </p>
          </div>
          <Input
            placeholder="Buscar por produtor, documento, cidade ou contato..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredProdutores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produtor cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_1fr_1fr_160px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Produtor</span>
                <span>Documento</span>
                <span>Cidade</span>
                <span className="text-right">Ações</span>
              </div>
              {filteredProdutores.map((produtor) => (
                <div
                  key={produtor.id}
                  className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_1fr_1fr_160px]"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">{produtor.name ?? produtor.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {produtor.contact ?? produtor.telefone ?? 'Sem contato'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {produtor.document ?? produtor.cpf_cnpj
                      ? `${documentLabel(produtor.document ?? produtor.cpf_cnpj)}: ${formatCpfCnpj(produtor.document ?? produtor.cpf_cnpj)}`
                      : 'Sem documento'}
                    {produtor.state_registration ? ` · IE: ${produtor.state_registration}` : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {produtor.city ?? produtor.cidade ?? 'Sem cidade'}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Dialog open={openView && selected?.id === produtor.id} onOpenChange={setOpenView}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(produtor);
                            setOpenView(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do produtor</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Nome:</strong> {selected.name}</p>
                            <p>
                              <strong>{documentLabel(selected.document)}:</strong>{' '}
                              {selected.document ? formatCpfCnpj(selected.document) : 'Sem documento'}
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

                    <Dialog open={openEdit && selected?.id === produtor.id} onOpenChange={setOpenEdit}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(produtor);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar produtor</DialogTitle>
                        </DialogHeader>
                        <ProdutorForm
                          producerId={produtor.id}
                          initialValues={{
                            nome: produtor.name ?? produtor.nome ?? '',
                            cpf_cnpj: produtor.document ?? produtor.cpf_cnpj ?? '',
                            telefone: produtor.contact ?? produtor.telefone ?? '',
                            cidade: produtor.city ?? produtor.cidade ?? '',
                          }}
                          onSuccess={() => {
                            setOpenEdit(false);
                            loadProdutores();
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
                          <AlertDialogTitle>Excluir produtor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(produtor.id)}>
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
