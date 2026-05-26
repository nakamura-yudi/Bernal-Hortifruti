import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { toast } from 'sonner';
import {
  cargasAPI,
  companiesAPI,
  embalagensAPI,
  freightRatesAPI,
  fretesAPI,
  producerProductPricesAPI,
  produtoresAPI,
  produtosAPI,
  servicesAPI,
  veiculosAPI,
} from '@/lib/api';

const DEFAULT_ORIGIN = 'Irapuru';
const DEFAULT_DESTINATION = 'Sao Paulo';

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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
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
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const freteSchema = z.object({
  producer_id: z.string().min(1, 'Selecione um produtor'),
  company_id: z.string().min(1, 'Selecione uma firma'),
  carga_id: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, 'Selecione um produto'),
        quantity: z.coerce.number().positive('Quantidade obrigatoria'),
        package_type_id: z.string().optional(),
        own_packaging: z.boolean().default(false),
        discount_per_unit: z.coerce.number().min(0).optional(),
        service_ids: z.array(z.number()).optional(),
      }),
    )
    .min(1, 'Adicione pelo menos um produto'),
  total_amount: z.undefined().optional(),
});

type FreteFormValues = z.infer<typeof freteSchema>;

interface FreteFormProps {
  freteId?: number;
  initialValues?: Partial<FreteFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const defaultValues: FreteFormValues = {
  producer_id: '',
  company_id: '',
  carga_id: '',
  items: [
    {
      product_id: '',
      quantity: 1,
      package_type_id: '',
      own_packaging: false,
      discount_per_unit: 0,
      service_ids: [],
    },
  ],
  total_amount: undefined,
};

export default function FreteForm({ freteId, initialValues, onSuccess, onCancel }: FreteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [firmas, setFirmas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [embalagens, setEmbalagens] = useState<any[]>([]);
  const [cargas, setCargas] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [producerProductPrices, setProducerProductPrices] = useState<any[]>([]);
  const [freightRates, setFreightRates] = useState<any[]>([]);

  const form = useForm<FreteFormValues>({
    resolver: zodResolver(freteSchema),
    defaultValues,
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'items',
  });


  useEffect(() => {
    loadProdutores();
    loadFirmas();
    loadProdutos();
    loadEmbalagens();
    loadServices();
    loadFreightRates();
    loadCargas();
    loadVeiculos();
  }, []);

  const selectedProducerId = form.watch('producer_id');

  useEffect(() => {
    loadProducerProductPrices(selectedProducerId ? Number(selectedProducerId) : undefined);
  }, [selectedProducerId]);

  useEffect(() => {
    if (!initialValues) {
      return;
    }
    const items = initialValues.items?.length ? initialValues.items : defaultValues.items;
    form.reset({ ...defaultValues, ...initialValues, items });
  }, [form, initialValues]);

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
      setProdutos(data);
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

  const loadCargas = async () => {
    try {
      const data = await cargasAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setCargas(list);
      const todayLabel = new Date().toLocaleDateString('en-CA');
      const activeToday = list.filter((carga) => {
        const rawDate = typeof carga.load_date === 'string' ? carga.load_date : '';
        const normalizedDate = rawDate.includes('T') ? rawDate.slice(0, 10) : rawDate;
        return normalizedDate === todayLabel && carga.status !== 'concluida';
      });
      if (!freteId && !form.getValues('carga_id') && activeToday.length > 0) {
        form.setValue('carga_id', String(activeToday[0].id));
      }
    } catch (error) {
      console.error('Erro ao carregar cargas:', error);
    }
  };

  const loadVeiculos = async () => {
    try {
      const data = await veiculosAPI.list();
      setVeiculos(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar veiculos:', error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await servicesAPI.list();
      setServices(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar servicos:', error);
    }
  };

  const loadFreightRates = async () => {
    try {
      const data = await freightRatesAPI.list();
      setFreightRates(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar taxas padrão de frete:', error);
      setFreightRates([]);
    }
  };

  const loadProducerProductPrices = async (producerId?: number) => {
    try {
      const data = await producerProductPricesAPI.list(
        producerId ? { producer_id: producerId } : undefined,
      );
      setProducerProductPrices(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar tabela de preços por produtor:', error);
      setProducerProductPrices([]);
    }
  };

  const productRateMap = useMemo(() => {
    const freightRateMap = new Map<number, number>();
    freightRates.forEach((rate) => {
      freightRateMap.set(Number(rate.product_id), Number(rate.rate_per_unit ?? 0));
    });

    const map = new Map<number, number>();
    produtos.forEach((produto) => {
      const rate =
        freightRateMap.get(Number(produto.id)) ??
        produto.rate_per_unit ??
        produto.freight_rate?.rate_per_unit ??
        produto.freight_rate?.rate ??
        produto.preco_unitario ??
        0;
      map.set(produto.id, Number(rate));
    });
    return map;
  }, [produtos, freightRates]);

  const packagePriceMap = useMemo(() => {
    const map = new Map<number, number>();
    embalagens.forEach((embalagem) => {
      map.set(embalagem.id, Number(embalagem.unit_price ?? embalagem.preco_unitario ?? 0));
    });
    return map;
  }, [embalagens]);

  const producerProductPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    producerProductPrices.forEach((item) => {
      const unit = String(item.unit ?? 'caixa').trim().toLowerCase();
      map.set(`${item.producer_id}-${item.product_id}-${unit}`, Number(item.unit_price ?? 0));
    });
    return map;
  }, [producerProductPrices]);

  const packageUnitById = useMemo(() => {
    const map = new Map<number, string>();
    embalagens.forEach((embalagem) => {
      map.set(embalagem.id, String(embalagem.name ?? embalagem.tipo ?? 'caixa'));
    });
    return map;
  }, [embalagens]);

  const getItemUnit = (packageTypeId?: number) => {
    if (!packageTypeId) {
      return 'caixa';
    }
    return packageUnitById.get(packageTypeId) ?? 'caixa';
  };

  const getUnitRate = (producerId: number, productId: number, packageTypeId?: number) => {
    if (producerId > 0 && productId > 0) {
      const unit = getItemUnit(packageTypeId).trim().toLowerCase();
      const producerRate = producerProductPriceMap.get(`${producerId}-${productId}-${unit}`);
      if (typeof producerRate === 'number') {
        return producerRate;
      }
    }
    return productRateMap.get(productId) ?? 0;
  };

  const servicePriceMap = useMemo(() => {
    const map = new Map<number, number>();
    services.forEach((service) => {
      map.set(service.id, Number(service.unit_price ?? 0));
    });
    return map;
  }, [services]);

  const normalizeDate = (value?: string) => {
    if (!value) {
      return '';
    }
    return value.includes('T') ? value.slice(0, 10) : value;
  };

  const formatDateBr = (value?: string) => {
    const normalized = normalizeDate(value);
    if (!normalized || normalized.length !== 10) {
      return '';
    }
    return `${normalized.slice(8, 10)}/${normalized.slice(5, 7)}/${normalized.slice(0, 4)}`;
  };

  const cargaSequenceMap = useMemo(() => {
    const map = new Map<number, number>();
    const byDate = new Map<string, any[]>();
    cargas.forEach((carga) => {
      const dateKey = normalizeDate(carga.load_date);
      if (!dateKey) {
        return;
      }
      const list = byDate.get(dateKey) ?? [];
      list.push(carga);
      byDate.set(dateKey, list);
    });
    byDate.forEach((list) => {
      list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      list.forEach((carga, index) => {
        map.set(carga.id, index + 1);
      });
    });
    return map;
  }, [cargas]);

  const watchedItems = form.watch('items');
  const watchedTotal = form.watch('total_amount');

  const baseTotal = useMemo(() => {
    const producerId = Number(form.watch('producer_id') || 0);
    return watchedItems.reduce((sum, item) => {
      const productId = Number(item.product_id || 0);
      const packageTypeId = Number(item.package_type_id || 0);
      const quantity = Number(item.quantity || 0);
      const rate = getUnitRate(producerId, productId, packageTypeId);
      return sum + rate * quantity;
    }, 0);
  }, [watchedItems, producerProductPriceMap, productRateMap, selectedProducerId, packageUnitById]);

  const packagingTotal = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const packageId = Number(item.package_type_id || 0);
      const quantity = Number(item.quantity || 0);
      const ownPackaging = Boolean(item.own_packaging);
      if (ownPackaging) {
        return sum;
      }
      const price = packagePriceMap.get(packageId) ?? 0;
      return sum + price * quantity;
    }, 0);
  }, [packagePriceMap, watchedItems]);

  const serviceTotal = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const serviceIds = item.service_ids ?? [];
      const itemTotal = serviceIds.reduce((serviceSum, id) => {
        const price = servicePriceMap.get(id) ?? 0;
        return serviceSum + price * quantity;
      }, 0);
      return sum + itemTotal;
    }, 0);
  }, [servicePriceMap, watchedItems]);

  const suggestedTotal = baseTotal + packagingTotal + serviceTotal;
  const itemDiscountTotal = watchedItems.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const discount = Number(item.discount_per_unit || 0);
    return sum + discount * quantity;
  }, 0);
  const suggestedWithDiscount = Math.max(suggestedTotal - itemDiscountTotal, 0);
  const finalTotal = suggestedWithDiscount;
  const discount = suggestedTotal - finalTotal;

  const onSubmit = async (values: FreteFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        producer_id: Number(values.producer_id),
        company_id: Number(values.company_id),
        carga_id: values.carga_id ? Number(values.carga_id) : null,
        origin_city: DEFAULT_ORIGIN,
        destination_city: DEFAULT_DESTINATION,
        items: values.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit: getItemUnit(Number(item.package_type_id || 0)),
          service_ids: item.service_ids ?? [],
        })),
        packages: values.items
          .filter((item) => item.package_type_id)
          .map((item) => ({
            package_type_id: Number(item.package_type_id),
            quantity: Number(item.quantity),
            own_packaging: Boolean(item.own_packaging),
          })),
        total_amount: values.total_amount,
      };

      if (freteId) {
        await fretesAPI.update(freteId, payload);
        toast.success('Frete atualizado com sucesso!');
      } else {
        await fretesAPI.create(payload);
        toast.success('Frete cadastrado com sucesso!');
        form.reset();
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar frete:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar frete');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="producer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produtor *</FormLabel>
                <FormControl>
                  <SearchCombobox
                    value={field.value}
                    placeholder="Selecione um produtor"
                    onChange={field.onChange}
                    options={produtores.map((produtor) => ({
                      value: String(produtor.id),
                      label: produtor.name ?? produtor.nome ?? 'Produtor',
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carga_id"
            render={({ field }) => {
              const todayLabel = new Date().toLocaleDateString('en-CA');
              const activeCargas = cargas.filter((carga) => {
                const normalizedDate = normalizeDate(carga.load_date);
                return normalizedDate === todayLabel && carga.status !== 'concluida';
              });
              const selectedCarga = cargas.find((carga) => String(carga.id) === field.value);
              const cargaOptions =
                selectedCarga && !activeCargas.some((carga) => carga.id === selectedCarga.id)
                  ? [selectedCarga, ...activeCargas]
                  : activeCargas;
              const cargaLabel = (carga: any) => {
                const dateLabel = formatDateBr(carga.load_date) || 'Data';
                const sequence = cargaSequenceMap.get(carga.id) ?? 0;
                const sequenceLabel = String(sequence).padStart(2, '0');
                return `Carga - ${dateLabel}-${sequenceLabel}`;
              };
              return (
                <FormItem>
                  <FormLabel>Carga do dia</FormLabel>
                  <FormControl>
                    <SearchCombobox
                      value={field.value}
                      placeholder="Selecione a carga ativa"
                      onChange={field.onChange}
                    options={cargaOptions.map((carga) => ({
                      value: String(carga.id),
                      label: cargaLabel(carga),
                    }))}
                  />
                </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma *</FormLabel>
                <FormControl>
                  <SearchCombobox
                    value={field.value}
                    placeholder="Selecione uma firma"
                    onChange={field.onChange}
                    options={firmas.map((firma) => ({
                      value: String(firma.id),
                      label: firma.name ?? firma.nome ?? 'Firma',
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <div className="space-y-3">
          <div>
            <div>
              <h3 className="text-base font-semibold">Produtos</h3>
              <p className="text-sm text-muted-foreground">Informe os produtos e quantidades.</p>
            </div>
          </div>

          {itemFields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-5">
              <FormField
                control={form.control}
                name={`items.${index}.product_id`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <FormControl>
                      <SearchCombobox
                        value={itemField.value}
                        placeholder="Selecione"
                        onChange={(value) => {
                          itemField.onChange(value);
                          form.setValue(`items.${index}.service_ids`, []);
                        }}
                        options={produtos.map((produto) => ({
                          value: String(produto.id),
                          label: produto.name ?? produto.nome ?? 'Produto',
                        }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.package_type_id`}
                render={({ field: packageField }) => (
                  <FormItem>
                    <FormLabel>Embalagem</FormLabel>
                    <FormControl>
                      <SearchCombobox
                        value={packageField.value}
                        placeholder="Selecione"
                        onChange={packageField.onChange}
                        options={embalagens.map((embalagem) => ({
                          value: String(embalagem.id),
                          label: embalagem.name ?? embalagem.tipo ?? 'Embalagem',
                        }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...itemField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.discount_per_unit`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel>Desconto por unidade</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...itemField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.own_packaging`}
                render={({ field: ownPackagingField }) => (
                  <FormItem className="sm:col-span-2">
                    <FormControl>
                      <label className="inline-flex h-10 items-center gap-3 rounded-md border px-3 text-sm font-semibold">
                        <span className="font-semibold">Embalagem Propria</span>
                        <Switch
                          checked={Boolean(ownPackagingField.value)}
                          onCheckedChange={ownPackagingField.onChange}
                        />
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.service_ids`}
                render={({ field }) => {
                  if (services.length === 0) {
                    return null;
                  }
                  return (
                    <FormItem className="sm:col-span-3 sm:-ml-3">
                      <FormControl>
                        <div className="flex min-h-10 w-full flex-wrap items-center gap-2">
                          {services.map((service: any) => {
                            const checked = (field.value ?? []).includes(service.id);
                            return (
                              <label
                                key={service.id}
                                className="inline-flex h-10 items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm min-w-[220px]"
                              >
                                <span className="font-semibold">
                                  {service.name} (R$ {Number(service.unit_price ?? 0).toFixed(2)})
                                </span>
                                <Switch
                                  checked={checked}
                                  onCheckedChange={(isChecked) => {
                                    if (isChecked) {
                                      field.onChange([...(field.value ?? []), service.id]);
                                    } else {
                                      field.onChange(
                                        (field.value ?? []).filter((id: number) => id !== service.id),
                                      );
                                    }
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

                <div className="flex items-end justify-between gap-2 sm:col-span-5">
                  <div className="text-sm text-muted-foreground">
                    Valor unit. frete: R${' '}
                  {(
                    getUnitRate(
                      Number(form.watch('producer_id') || 0),
                      Number(form.watch(`items.${index}.product_id`) || 0),
                      Number(form.watch(`items.${index}.package_type_id`) || 0),
                    )
                  ).toFixed(2)}
                  {' | '}Embalagem: R${' '}
                  {(
                    Boolean(form.watch(`items.${index}.own_packaging`))
                      ? 0
                      : packagePriceMap.get(Number(form.watch(`items.${index}.package_type_id`) || 0)) ?? 0
                  ).toFixed(2)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={itemFields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendItem({
                product_id: '',
                quantity: 1,
                package_type_id: '',
                own_packaging: false,
                discount_per_unit: 0,
                service_ids: [],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar produto
          </Button>
        </div>

        <div className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Valor do frete total</p>
            <p className="text-2xl font-semibold">R$ {finalTotal.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Valor do desconto total</p>
            <p className="text-2xl font-semibold">R$ {discount.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : freteId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
