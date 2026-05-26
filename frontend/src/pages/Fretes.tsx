import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Calendar, Eye, Pencil, Trash2, DollarSign, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import FreteForm from '@/components/forms/FreteForm';
import { companiesAPI, embalagensAPI, fretesAPI, produtoresAPI, produtosAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function Fretes() {
  const [search, setSearch] = useState('');
  const [fretes, setFretes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [firmas, setFirmas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [embalagens, setEmbalagens] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    freteTotal: 0,
    embalagemTotal: 0,
    fretesHoje: 0,
  });
  const totalFretes = fretes.length;

  useEffect(() => {
    loadFretes();
    loadProdutores();
    loadFirmas();
    loadProdutos();
    loadEmbalagens();
  }, []);

  const loadProdutores = async () => {
    try {
      const data = await produtoresAPI.list();
      setProdutores(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
    }
  };

  const loadFirmas = async () => {
    try {
      const data = await companiesAPI.list();
      setFirmas(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar firmas:', error);
    }
  };

  const loadProdutos = async () => {
    try {
      const data = await produtosAPI.list();
      setProdutos(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadEmbalagens = async () => {
    try {
      const data = await embalagensAPI.list();
      setEmbalagens(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar embalagens:', error);
    }
  };

  const loadFretes = async () => {
    setIsLoading(true);
    try {
      const data = await fretesAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setFretes(list);
      updateDailyTotals(list);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFretes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return fretes;
    }
    return fretes.filter((frete) => {
      const producer = String(frete.producer_id ?? '');
      const company = String(frete.company_id ?? '');
      const origin = String(frete.origin_city ?? '');
      const destination = String(frete.destination_city ?? '');
      return (
        producer.includes(term) ||
        company.includes(term) ||
        origin.toLowerCase().includes(term) ||
        destination.toLowerCase().includes(term)
      );
    });
  }, [fretes, search]);

  const producerNameById = (id?: number) => {
    if (!id) {
      return '';
    }
    return produtores.find((item) => item.id === id)?.name ?? '';
  };

  const companyNameById = (id?: number) => {
    if (!id) {
      return '';
    }
    return firmas.find((item) => item.id === id)?.name ?? '';
  };

  const productNameById = (id?: number) => {
    if (!id) {
      return '';
    }
    const product = produtos.find((item) => item.id === id);
    return product?.name ?? product?.nome ?? '';
  };

  const packageNameById = (id?: number) => {
    if (!id) {
      return '';
    }
    const packageType = embalagens?.find((item: any) => item.id === id);
    return packageType?.name ?? packageType?.tipo ?? '';
  };

  const updateDailyTotals = (list: any[]) => {
    const todayLabel = new Date().toLocaleDateString('pt-BR');
    const todayFretes = list.filter((frete) => {
      if (!frete.created_at) {
        return false;
      }
      const dateLabel = new Date(frete.created_at).toLocaleDateString('pt-BR');
      return dateLabel === todayLabel;
    });

    const freteTotal = todayFretes.reduce(
      (sum, frete) => sum + Number(frete.total_amount ?? 0),
      0
    );
    const embalagemTotal = todayFretes.reduce(
      (sum, frete) => sum + Number(frete.packaging_amount ?? 0),
      0
    );

    setDailyTotals({
      freteTotal,
      embalagemTotal,
      fretesHoje: todayFretes.length,
    });
  };

  const handleDelete = async (freteId: number) => {
    try {
      await fretesAPI.delete(freteId);
      setFretes((prev) => prev.filter((item) => item.id !== freteId));
      toast.success('Frete excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir frete:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir frete');
    }
  };

  const buildInitialValues = (frete: any) => {
    const items = Array.isArray(frete.items) ? frete.items : [];
    const packages = Array.isArray(frete.packages) ? frete.packages : [];
    const mappedItems =
      items.length > 0
        ? items.map((item: any, index: number) => ({
            product_id: String(item.product_id ?? ''),
            quantity: Number(item.quantity ?? 0),
            package_type_id: packages[index]?.package_type_id
              ? String(packages[index].package_type_id)
              : '',
            own_packaging: Boolean(
              packages[index]?.own_packaging ?? Number(packages[index]?.unit_price ?? 0) === 0,
            ),
            discount_per_unit: 0,
            service_ids: Array.isArray(item.service_ids) ? item.service_ids : [],
          }))
        : [
            {
              product_id: '',
              quantity: 1,
              package_type_id: '',
              own_packaging: false,
              discount_per_unit: 0,
              service_ids: [],
            },
          ];

    return {
      producer_id: String(frete.producer_id ?? ''),
      company_id: String(frete.company_id ?? ''),
      carga_id: frete.carga_id ? String(frete.carga_id) : '',
      items: mappedItems,
      total_amount: undefined,
    };
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Fretes
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Controle de fretes</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Acompanhe produtores, firmas e totais em tempo real.
            </p>
          </div>
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Frete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo frete</DialogTitle>
              </DialogHeader>
              <FreteForm
                onSuccess={() => {
                  setOpenModal(false);
                  loadFretes();
                }}
                onCancel={() => setOpenModal(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar fretes por produtor, firma ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              <span className="sm:hidden">Filtrar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fretes cadastrados
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFretes}</div>
            <p className="text-xs text-muted-foreground mt-1">Total no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Frete do dia
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {Number(dailyTotals.freteTotal).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dailyTotals.fretesHoje} fretes hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-sky-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Embalagem do dia
            </CardTitle>
            <Box className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {Number(dailyTotals.embalagemTotal).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Acumulado de hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Fretes cadastrados</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visualize os dados completos dos fretes registrados.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredFretes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum frete cadastrado. Comece criando seu primeiro frete!
            </p>
          ) : (
            <div className="space-y-3">
              {filteredFretes.map((frete) => (
                <div
                  key={frete.id}
                  className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_2fr_1fr_1fr_auto] sm:items-center"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Frete #{frete.id}
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {producerNameById(frete.producer_id) || 'Produtor'} →{' '}
                      {companyNameById(frete.company_id) || 'Firma'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Array.isArray(frete.items) && frete.items.length > 0 ? (
                      <div className="space-y-1">
                        {frete.items.map((item: any) => {
                          const name = productNameById(item.product_id) || 'Produto';
                          const unit = item.unit ? ` ${item.unit}` : '';
                          return (
                            <div key={item.id ?? `${item.product_id}-${item.quantity}`}>
                              {name} ({item.quantity ?? 0}
                              {unit})
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sem itens</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {frete.created_at
                        ? new Date(frete.created_at).toLocaleDateString()
                        : 'Sem data'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2 text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold text-foreground">
                      R$ {Number(frete.total_amount ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Dialog open={openView && selected?.id === frete.id} onOpenChange={setOpenView}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(frete);
                            setOpenView(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do frete</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-3 text-sm">
                            <div>
                              <p>
                                <strong>Produtor:</strong>{' '}
                                {producerNameById(selected.producer_id) || 'Produtor'}
                              </p>
                              <p>
                                <strong>Firma:</strong>{' '}
                                {companyNameById(selected.company_id) || 'Firma'}
                              </p>
                              <p>
                                <strong>Data:</strong>{' '}
                                {selected.created_at
                                  ? new Date(selected.created_at).toLocaleDateString()
                                  : 'Sem data'}
                              </p>
                            </div>
                            <div>
                              <p><strong>Total:</strong> R$ {Number(selected.total_amount ?? 0).toFixed(2)}</p>
                              <p><strong>Base:</strong> R$ {Number(selected.base_amount ?? 0).toFixed(2)}</p>
                              <p><strong>Embalagens:</strong> R$ {Number(selected.packaging_amount ?? 0).toFixed(2)}</p>
                              <p><strong>Serviços:</strong> R$ {Number(selected.service_amount ?? 0).toFixed(2)}</p>
                            </div>
                            {Array.isArray(selected.items) && selected.items.length > 0 && (
                              <div>
                                <p className="font-medium">Itens</p>
                                <div className="space-y-1 text-muted-foreground">
                                  {selected.items.map((item: any) => (
                                    <p key={item.id}>
                                      {productNameById(item.product_id) || 'Produto'} - {item.quantity}{' '}
                                      {item.unit}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {Array.isArray(selected.packages) && selected.packages.length > 0 && (
                              <div>
                                <p className="font-medium">Embalagens</p>
                                <div className="space-y-1 text-muted-foreground">
                                  {selected.packages.map((pkg: any) => (
                                    <p key={pkg.id}>
                                      {packageNameById(pkg.package_type_id) || 'Embalagem'} -{' '}
                                      {pkg.quantity}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openEdit && selected?.id === frete.id} onOpenChange={setOpenEdit}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(frete);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar frete</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <FreteForm
                            freteId={selected.id}
                            initialValues={buildInitialValues(selected)}
                            onSuccess={() => {
                              setOpenEdit(false);
                              loadFretes();
                            }}
                            onCancel={() => setOpenEdit(false)}
                          />
                        )}
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
                          <AlertDialogTitle>Excluir frete</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(frete.id)}>
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
