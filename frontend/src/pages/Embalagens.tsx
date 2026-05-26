import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Pencil, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { embalagensAPI, fretesAPI, packageDeliveriesAPI, packageStockAPI, produtoresAPI } from '@/lib/api';
import EmbalagemForm from '@/components/forms/EmbalagemForm';
import PackageDeliveryForm from '@/components/forms/PackageDeliveryForm';
import PackageStockEntryForm from '@/components/forms/PackageStockEntryForm';
import { toast } from 'sonner';

type ComboOption = {
  value: string;
  label: string;
};

interface SearchComboboxProps {
  value: string;
  options: ComboOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

function SearchCombobox({ value, options, placeholder, onChange }: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selected?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === option.value ? 'opacity-100' : 'opacity-0'}`} />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Embalagens() {
  const [embalagens, setEmbalagens] = useState<any[]>([]);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [fretes, setFretes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelivery, setOpenDelivery] = useState(false);
  const [openStockEntry, setOpenStockEntry] = useState(false);
  const [filterProducerId, setFilterProducerId] = useState('all');
  const [filterPackageId, setFilterPackageId] = useState('all');
  const totalEmbalagens = embalagens.length;
  const avgPreco =
    totalEmbalagens > 0
      ? embalagens.reduce((sum, item) => sum + Number(item.unit_price ?? item.preco_unitario ?? 0), 0) /
        totalEmbalagens
      : 0;

  useEffect(() => {
    loadEmbalagens();
    loadProdutores();
    loadDeliveries();
    loadStockEntries();
    loadFretes();
  }, []);

  const loadEmbalagens = async () => {
    setIsLoading(true);
    try {
      const data = await embalagensAPI.list();
      setEmbalagens(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar embalagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProdutores = async () => {
    try {
      const data = await produtoresAPI.list();
      setProdutores(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
    }
  };

  const loadDeliveries = async () => {
    try {
      const data = await packageDeliveriesAPI.list();
      setDeliveries(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar envios de embalagem:', error);
    }
  };

  const loadStockEntries = async () => {
    try {
      const data = await packageStockAPI.list();
      setStockEntries(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar entradas de estoque:', error);
    }
  };

  const loadFretes = async () => {
    try {
      const data = await fretesAPI.list();
      setFretes(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
    }
  };

  const producerNameById = (id?: number) => {
    if (!id) {
      return '';
    }
    return produtores.find((item) => item.id === id)?.name ?? '';
  };

  const packageNameById = (id?: number) => {
    if (!id) {
      return '';
    }
    return embalagens.find((item) => item.id === id)?.name ?? '';
  };

  const reportRows = useMemo(() => {
    const deliveryMap = new Map<string, number>();
    deliveries.forEach((delivery) => {
      const key = `${delivery.producer_id}-${delivery.package_type_id}`;
      const current = deliveryMap.get(key) ?? 0;
      deliveryMap.set(key, current + Number(delivery.quantity ?? 0));
    });

    const usedMap = new Map<string, number>();
    fretes.forEach((frete) => {
      const packages = Array.isArray(frete.packages) ? frete.packages : [];
      packages.forEach((pkg: any) => {
        if (pkg?.own_packaging) {
          return;
        }
        const key = `${frete.producer_id}-${pkg.package_type_id}`;
        const current = usedMap.get(key) ?? 0;
        usedMap.set(key, current + Number(pkg.quantity ?? 0));
      });
    });

    const keys = new Set<string>([...deliveryMap.keys(), ...usedMap.keys()]);
    const rows = Array.from(keys).map((key) => {
      const [producerId, packageTypeId] = key.split('-').map((value) => Number(value));
      const delivered = deliveryMap.get(key) ?? 0;
      const used = usedMap.get(key) ?? 0;
      return {
        key,
        producerId,
        packageTypeId,
        delivered,
        used,
        balance: delivered - used,
      };
    });

    const filteredRows = rows.filter((row) => {
      if (filterProducerId !== 'all' && row.producerId !== Number(filterProducerId)) {
        return false;
      }
      if (filterPackageId !== 'all' && row.packageTypeId !== Number(filterPackageId)) {
        return false;
      }
      return true;
    });

    return filteredRows.sort((a, b) => {
      if (a.producerId !== b.producerId) {
        return a.producerId - b.producerId;
      }
      return a.packageTypeId - b.packageTypeId;
    });
  }, [deliveries, fretes, filterProducerId, filterPackageId]);

  const totalsEnvios = useMemo(() => {
    return reportRows.reduce(
      (acc, row) => {
        acc.enviado += Number(row.delivered ?? 0);
        acc.usado += Number(row.used ?? 0);
        acc.saldo += Number(row.balance ?? 0);
        return acc;
      },
      { enviado: 0, usado: 0, saldo: 0 }
    );
  }, [reportRows]);

  const stockRows = useMemo(() => {
    const stockMap = new Map<number, number>();
    stockEntries.forEach((entry) => {
      const current = stockMap.get(entry.package_type_id) ?? 0;
      stockMap.set(entry.package_type_id, current + Number(entry.quantity ?? 0));
    });

    return embalagens.map((embalagem) => ({
      id: embalagem.id,
      name: embalagem.name ?? embalagem.tipo ?? 'Embalagem',
      quantity: stockMap.get(embalagem.id) ?? 0,
    }));
  }, [embalagens, stockEntries]);

  const handleDelete = async (embalagemId: number) => {
    try {
      await embalagensAPI.delete(embalagemId);
      setEmbalagens((prev) => prev.filter((item) => item.id !== embalagemId));
      toast.success('Embalagem excluida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir embalagem:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir embalagem');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Embalagens
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Controle de embalagens</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Acompanhe tipos, envios e saldos por produtor.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="embalagens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="embalagens">Embalagens</TabsTrigger>
          <TabsTrigger value="envios">Envios</TabsTrigger>
        </TabsList>

        <TabsContent value="embalagens" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-muted/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tipos cadastrados
                </CardTitle>
                <span className="text-xs font-semibold text-muted-foreground">BASE</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEmbalagens}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de tipos</p>
              </CardContent>
            </Card>
            <Card className="bg-sky-50/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Preço médio
                </CardTitle>
                <span className="text-xs font-semibold text-sky-600">R$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {avgPreco.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Média das embalagens</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="estoque-caixas" className="space-y-6">
            <TabsList>
              <TabsTrigger value="estoque-caixas">Estoque de caixas</TabsTrigger>
              <TabsTrigger value="lista-embalagens">Lista de Embalagens</TabsTrigger>
            </TabsList>

            <TabsContent value="estoque-caixas" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={openStockEntry} onOpenChange={setOpenStockEntry}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Entrada no estoque
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Entrada de caixas</DialogTitle>
                    </DialogHeader>
                    <PackageStockEntryForm
                      onSuccess={() => {
                        setOpenStockEntry(false);
                        loadStockEntries();
                      }}
                      onCancel={() => setOpenStockEntry(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Estoque de caixas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Total de caixas registradas por tipo.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stockRows.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma entrada de estoque registrada.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="hidden grid-cols-[2fr_1fr] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                        <span>Embalagem</span>
                        <span>Quantidade</span>
                      </div>
                      {stockRows.map((row) => (
                        <div
                          key={row.id}
                          className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm sm:grid-cols-[2fr_1fr]"
                        >
                          <p className="text-base font-semibold text-foreground">{row.name}</p>
                          <p className="text-sm text-muted-foreground">{Number(row.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lista-embalagens" className="space-y-4">
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Embalagem
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova embalagem</DialogTitle>
                    </DialogHeader>
                    <EmbalagemForm
                      onSuccess={() => {
                        loadEmbalagens();
                      }}
                      onCancel={() => undefined}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Lista de Embalagens</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Consulte preços e gerencie ações rapidamente.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Carregando...</p>
                  ) : embalagens.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma embalagem cadastrada.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="hidden grid-cols-[2fr_1fr_160px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                        <span>Embalagem</span>
                        <span>Preco unitario</span>
                        <span className="text-right">Acoes</span>
                      </div>
                      {embalagens.map((embalagem) => (
                        <div
                          key={embalagem.id}
                          className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_1fr_160px]"
                        >
                          <div>
                            <p className="text-base font-semibold text-foreground">{embalagem.name ?? embalagem.tipo}</p>
                            <p className="text-sm text-muted-foreground">ID: {embalagem.id}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            R$ {Number(embalagem.unit_price ?? 0).toFixed(2)}
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <Dialog open={openView && selected?.id === embalagem.id} onOpenChange={setOpenView}>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelected(embalagem);
                                    setOpenView(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Detalhes da embalagem</DialogTitle>
                                </DialogHeader>
                                {selected && (
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Nome:</strong> {selected.name}</p>
                                    <p><strong>Preco:</strong> R$ {Number(selected.unit_price ?? 0).toFixed(2)}</p>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog open={openEdit && selected?.id === embalagem.id} onOpenChange={setOpenEdit}>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelected(embalagem);
                                    setOpenEdit(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar embalagem</DialogTitle>
                                </DialogHeader>
                                <EmbalagemForm
                                  embalagemId={embalagem.id}
                                  initialValues={{
                                    tipo: embalagem.name ?? '',
                                    preco_unitario: String(embalagem.unit_price ?? ''),
                                  }}
                                  onSuccess={() => {
                                    setOpenEdit(false);
                                    loadEmbalagens();
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
                                  <AlertDialogTitle>Excluir embalagem</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza? Essa ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(embalagem.id)}>
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
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="envios" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={openDelivery} onOpenChange={setOpenDelivery}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar envio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Envio de embalagens</DialogTitle>
                </DialogHeader>
                <PackageDeliveryForm
                  onSuccess={() => {
                    setOpenDelivery(false);
                    loadDeliveries();
                  }}
                  onCancel={() => setOpenDelivery(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-muted/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Enviadas
                </CardTitle>
                <span className="text-xs font-semibold text-muted-foreground">TOTAL</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalsEnvios.enviado.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Quantidade total</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usadas no transporte
                </CardTitle>
                <span className="text-xs font-semibold text-amber-600">USO</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalsEnvios.usado.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Saídas em fretes</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo disponível
                </CardTitle>
                <span className="text-xs font-semibold text-emerald-600">SALDO</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalsEnvios.saldo.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Disponível</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Relatorio de embalagens por produtor</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Controle envios, uso no transporte e saldo por produtor.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Produtor</label>
                  <SearchCombobox
                    value={filterProducerId}
                    placeholder="Todos"
                    onChange={setFilterProducerId}
                    options={[
                      { value: 'all', label: 'Todos' },
                      ...produtores.map((produtor) => ({
                        value: String(produtor.id),
                        label: produtor.name ?? produtor.nome,
                      })),
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Embalagem</label>
                  <SearchCombobox
                    value={filterPackageId}
                    placeholder="Todas"
                    onChange={setFilterPackageId}
                    options={[
                      { value: 'all', label: 'Todas' },
                      ...embalagens.map((embalagem) => ({
                        value: String(embalagem.id),
                        label: embalagem.name ?? embalagem.tipo,
                      })),
                    ]}
                  />
                </div>
              </div>
              {reportRows.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum envio de embalagem registrado.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                    <span>Produtor</span>
                    <span>Embalagem</span>
                    <span>Enviadas</span>
                    <span>Usadas no transporte</span>
                    <span>Saldo</span>
                  </div>
                  {reportRows.map((row) => {
                    const produtorNome = producerNameById(row.producerId);
                    const embalagemNome = packageNameById(row.packageTypeId);
                    return (
                      <div
                        key={row.key}
                        className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_2fr_1fr_1fr_1fr]"
                      >
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {produtorNome || `Produtor #${row.producerId}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {row.producerId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {embalagemNome || `Embalagem #${row.packageTypeId}`}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Number(row.delivered).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Number(row.used).toFixed(2)}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {Number(row.balance).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
