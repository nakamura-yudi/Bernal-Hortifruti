import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { produtoresAPI, producerProductPricesAPI, embalagensAPI, produtosAPI } from '@/lib/api';
import { toast } from 'sonner';

type Producer = { id: number; name: string };
type Product = { id: number; name: string; default_unit?: string };
type PackageType = { id: number; name: string };
type PriceRow = {
  id: number;
  producer_id: number;
  product_id: number;
  unit_price: number;
  unit: string;
};

type FormValues = {
  producer_id: string;
  product_id: string;
  unit_price: string;
  unit: string;
};

const defaultFormValues: FormValues = {
  producer_id: '',
  product_id: '',
  unit_price: '',
  unit: 'caixa',
};

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

export default function ListaPrecos() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState<PriceRow | null>(null);
  const [createForm, setCreateForm] = useState<FormValues>(defaultFormValues);
  const [editForm, setEditForm] = useState<FormValues>(defaultFormValues);
  const [filterProducer, setFilterProducer] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [producersData, productsData, packagesData, pricesData] = await Promise.all([
        produtoresAPI.list(),
        produtosAPI.list(),
        embalagensAPI.list(),
        producerProductPricesAPI.list(),
      ]);
      setProducers(Array.isArray(producersData) ? producersData : producersData?.items ?? []);
      setProducts(Array.isArray(productsData) ? productsData : productsData?.items ?? []);
      setPackageTypes(Array.isArray(packagesData) ? packagesData : packagesData?.items ?? []);
      setPrices(Array.isArray(pricesData) ? pricesData : pricesData?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar lista de preços:', error);
      toast.error('Erro ao carregar lista de preços');
    } finally {
      setIsLoading(false);
    }
  };

  const producerById = useMemo(() => {
    return new Map(producers.map((item) => [item.id, item.name]));
  }, [producers]);

  const productById = useMemo(() => {
    return new Map(products.map((item) => [item.id, item]));
  }, [products]);

  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const producerOk = filterProducer === 'all' || item.producer_id === Number(filterProducer);
      const productOk = filterProduct === 'all' || item.product_id === Number(filterProduct);
      return producerOk && productOk;
    });
  }, [prices, filterProducer, filterProduct]);

  const handleCreate = async () => {
    if (!createForm.producer_id || !createForm.product_id || !createForm.unit || !createForm.unit_price) {
      toast.error('Preencha produtor, produto, caixa e preço');
      return;
    }
    setIsSaving(true);
    try {
      await producerProductPricesAPI.create({
        producer_id: Number(createForm.producer_id),
        product_id: Number(createForm.product_id),
        unit_price: Number(createForm.unit_price),
        unit: createForm.unit || 'caixa',
      });
      toast.success('Preço cadastrado com sucesso');
      setCreateForm(defaultFormValues);
      setOpenCreate(false);
      await loadAll();
    } catch (error: any) {
      console.error('Erro ao cadastrar preço:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar preço');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (row: PriceRow) => {
    setSelected(row);
    setEditForm({
      producer_id: String(row.producer_id),
      product_id: String(row.product_id),
      unit_price: String(Number(row.unit_price).toFixed(2)),
      unit: row.unit || 'caixa',
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selected) {
      return;
    }
    if (!editForm.producer_id || !editForm.product_id || !editForm.unit || !editForm.unit_price) {
      toast.error('Preencha produtor, produto, caixa e preço');
      return;
    }
    setIsSaving(true);
    try {
      await producerProductPricesAPI.update(selected.id, {
        producer_id: Number(editForm.producer_id),
        product_id: Number(editForm.product_id),
        unit_price: Number(editForm.unit_price),
        unit: editForm.unit || 'caixa',
      });
      toast.success('Preço atualizado com sucesso');
      setOpenEdit(false);
      setSelected(null);
      await loadAll();
    } catch (error: any) {
      console.error('Erro ao atualizar preço:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar preço');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await producerProductPricesAPI.delete(id);
      setPrices((prev) => prev.filter((item) => item.id !== id));
      toast.success('Preço removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover preço:', error);
      toast.error(error.response?.data?.detail || 'Erro ao remover preço');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Lista de Preços
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Preços por produtor e produto
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Defina preços personalizados por produtor para cada produto.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Preço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo preço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Produtor</Label>
                  <SearchCombobox
                    value={createForm.producer_id}
                    placeholder="Selecione"
                    onChange={(value) => setCreateForm((prev) => ({ ...prev, producer_id: value }))}
                    options={producers.map((producer) => ({
                      value: String(producer.id),
                      label: producer.name,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <SearchCombobox
                    value={createForm.product_id}
                    placeholder="Selecione"
                    onChange={(value) => setCreateForm((prev) => ({ ...prev, product_id: value }))}
                    options={products.map((product) => ({
                      value: String(product.id),
                      label: product.name,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Caixa</Label>
                  <SearchCombobox
                    value={createForm.unit}
                    placeholder="Selecione"
                    onChange={(value) => setCreateForm((prev) => ({ ...prev, unit: value }))}
                    options={packageTypes.map((packageType) => ({
                      value: packageType.name,
                      label: packageType.name,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço unitário (R$)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={createForm.unit_price}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, unit_price: event.target.value }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleCreate} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Produtor</Label>
            <SearchCombobox
              value={filterProducer}
              placeholder="Todos"
              onChange={setFilterProducer}
              options={[
                { value: 'all', label: 'Todos' },
                ...producers.map((producer) => ({
                  value: String(producer.id),
                  label: producer.name,
                })),
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>Produto</Label>
            <SearchCombobox
              value={filterProduct}
              placeholder="Todos"
              onChange={setFilterProduct}
              options={[
                { value: 'all', label: 'Todos' },
                ...products.map((product) => ({
                  value: String(product.id),
                  label: product.name,
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preços cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredPrices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum preço cadastrado.</p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_120px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Produtor</span>
                <span>Produto</span>
                <span>Caixa</span>
                <span>Preço</span>
                <span className="text-right">Acoes</span>
              </div>
              {filteredPrices.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm sm:grid-cols-[2fr_2fr_1fr_1fr_120px]"
                >
                  <div className="text-sm">{producerById.get(row.producer_id) ?? `ID ${row.producer_id}`}</div>
                  <div className="text-sm">{productById.get(row.product_id)?.name ?? `ID ${row.product_id}`}</div>
                  <div className="text-sm">{row.unit || productById.get(row.product_id)?.default_unit || 'caixa'}</div>
                  <div className="text-sm font-medium">R$ {Number(row.unit_price).toFixed(2)}</div>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir preço</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(row.id)}>
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

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar preço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produtor</Label>
              <SearchCombobox
                value={editForm.producer_id}
                placeholder="Selecione"
                onChange={(value) => setEditForm((prev) => ({ ...prev, producer_id: value }))}
                options={producers.map((producer) => ({
                  value: String(producer.id),
                  label: producer.name,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <SearchCombobox
                value={editForm.product_id}
                placeholder="Selecione"
                onChange={(value) => setEditForm((prev) => ({ ...prev, product_id: value }))}
                options={products.map((product) => ({
                  value: String(product.id),
                  label: product.name,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Caixa</Label>
              <SearchCombobox
                value={editForm.unit}
                placeholder="Selecione"
                onChange={(value) => setEditForm((prev) => ({ ...prev, unit: value }))}
                options={packageTypes.map((packageType) => ({
                  value: packageType.name,
                  label: packageType.name,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço unitário (R$)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={editForm.unit_price}
                onChange={(event) => setEditForm((prev) => ({ ...prev, unit_price: event.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
