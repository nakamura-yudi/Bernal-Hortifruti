import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { freightRatesAPI, produtosAPI } from '@/lib/api';
import ProdutoForm from '@/components/forms/ProdutoForm';
import { toast } from 'sonner';

export default function Produtos() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    setIsLoading(true);
    try {
      const [productsData, ratesData] = await Promise.all([
        produtosAPI.list(),
        freightRatesAPI.list(),
      ]);
      setProdutos(Array.isArray(productsData) ? productsData : productsData?.items ?? []);
      setRates(Array.isArray(ratesData) ? ratesData : ratesData?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rateByProduct = (productId: number) => {
    return rates.find((rate) => rate.product_id === productId);
  };
  const totalProdutos = produtos.length;
  const comTarifa = produtos.filter((produto) => Number(rateByProduct(produto.id)?.rate_per_unit ?? 0) > 0).length;
  const semTarifa = totalProdutos - comTarifa;
  const filteredProdutos = produtos.filter((produto) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return true;
    }
    const content = `${produto.name ?? ''} ${produto.default_unit ?? ''} ${produto.id ?? ''}`.toLowerCase();
    return content.includes(term);
  });

  const handleDelete = async (productId: number) => {
    try {
      await produtosAPI.delete(productId);
      setProdutos((prev) => prev.filter((item) => item.id !== productId));
      toast.success('Produto excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir produto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Produtos
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Catálogo de produtos</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Ajuste tarifas e unidades com rapidez.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo produto</DialogTitle>
              </DialogHeader>
              <ProdutoForm
                onSuccess={() => {
                  loadProdutos();
                }}
                onCancel={() => navigate('/produtos')}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de produtos
            </CardTitle>
            <span className="text-xs font-semibold text-muted-foreground">BASE</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastros ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com tarifa
            </CardTitle>
            <span className="text-xs font-semibold text-emerald-600">OK</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comTarifa}</div>
            <p className="text-xs text-muted-foreground mt-1">Frete definido</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem tarifa
            </CardTitle>
            <span className="text-xs font-semibold text-amber-600">ATENÇÃO</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semTarifa}</div>
            <p className="text-xs text-muted-foreground mt-1">Revisar preços</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de Produtos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consulte detalhes e gerencie ações rapidamente.
            </p>
          </div>
          <Input
            placeholder="Buscar por produto, unidade ou ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredProdutos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_1fr_1fr_160px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Produto</span>
                <span>Unidade</span>
                <span>Tarifa</span>
                <span className="text-right">Acoes</span>
              </div>
              {filteredProdutos.map((produto) => {
                const rate = rateByProduct(produto.id);
                return (
                  <div
                    key={produto.id}
                    className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_1fr_1fr_160px]"
                  >
                    <div>
                      <p className="text-base font-semibold text-foreground">{produto.name ?? produto.nome}</p>
                      <p className="text-sm text-muted-foreground">ID: {produto.id}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {produto.default_unit ?? produto.unidade_medida ?? 'caixa'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R$ {Number(rate?.rate_per_unit ?? 0).toFixed(2)}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Dialog open={openView && selected?.id === produto.id} onOpenChange={setOpenView}>
                        <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                            onClick={() => {
                              setSelected({ ...produto, rate });
                              setOpenView(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes do produto</DialogTitle>
                          </DialogHeader>
                          {selected && (
                            <div className="space-y-2 text-sm">
                              <p><strong>Nome:</strong> {selected.name}</p>
                              <p><strong>Unidade:</strong> {selected.default_unit ?? 'caixa'}</p>
                              <p><strong>Tarifa:</strong> R$ {Number(selected.rate?.rate_per_unit ?? 0).toFixed(2)}</p>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog open={openEdit && selected?.id === produto.id} onOpenChange={setOpenEdit}>
                        <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                            onClick={() => {
                              setSelected({ ...produto, rate });
                              setOpenEdit(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar produto</DialogTitle>
                          </DialogHeader>
                          <ProdutoForm
                            productId={produto.id}
                            rateId={rate?.id ?? null}
                            initialValues={{
                              nome: produto.name ?? '',
                              unidade_medida: produto.default_unit ?? 'un',
                              tarifa_frete: String(rate?.rate_per_unit ?? ''),
                            }}
                            onSuccess={() => {
                              setOpenEdit(false);
                              loadProdutos();
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
                            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza? Essa ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(produto.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
