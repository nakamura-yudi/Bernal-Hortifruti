import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { lotesAPI, companiesAPI, produtoresAPI } from '@/lib/api';

const itemSchema = z.object({
  _itemId: z.string().optional(), // ID do backend para itens já existentes
  produtor_id: z.string().optional(),
  valor: z.string().optional(),
  data_entrega: z.string().optional(),
  observacao: z.string().optional(),
});

const schema = z.object({
  firma_id: z.coerce.number({ required_error: 'Selecione a firma' }).positive('Selecione a firma'),
  data_chegada: z.string().min(1, 'Data de chegada obrigatória'),
  observacao: z.string().optional(),
  itens: z.array(itemSchema),
});

type FormValues = z.infer<typeof schema>;

interface PagamentoFormProps {
  lote?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function emptyItem() {
  return { _itemId: '', produtor_id: '', valor: '', data_entrega: '', observacao: '' };
}

export default function PagamentoForm({ lote, onSuccess, onCancel }: PagamentoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [firmas, setFirmas] = useState<any[]>([]);
  const [produtores, setProdutores] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firma_id: lote?.firma_id ?? 0,
      data_chegada: lote?.data_chegada ?? new Date().toISOString().split('T')[0],
      observacao: lote?.observacao ?? '',
      itens: lote?.itens?.map((item: any) => ({
        _itemId: String(item.id),
        produtor_id: item.produtor_id ? String(item.produtor_id) : '',
        valor: item.valor != null ? String(item.valor) : '',
        data_entrega: item.data_entrega ?? '',
        observacao: item.observacao ?? '',
      })) ?? [emptyItem()],
    },
  });

  const { fields, prepend, remove } = useFieldArray({ control: form.control, name: 'itens' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [firmasData, produtoresData] = await Promise.all([
          companiesAPI.list(),
          produtoresAPI.list(),
        ]);
        setFirmas(Array.isArray(firmasData) ? firmasData : firmasData?.items ?? []);
        setProdutores(Array.isArray(produtoresData) ? produtoresData : produtoresData?.items ?? []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const itens = values.itens
        .filter((item) => item.produtor_id || item.valor)
        .map((item) => ({
          produtor_id: item.produtor_id ? Number(item.produtor_id) : null,
          valor: item.valor ? parseFloat(item.valor) : null,
          data_entrega: item.data_entrega || null,
          observacao: item.observacao || null,
        }));

      if (lote) {
        await lotesAPI.update(lote.id, {
          firma_id: values.firma_id,
          data_chegada: values.data_chegada,
          observacao: values.observacao || null,
        });

        for (const [index, item] of itens.entries()) {
          const rawItem = values.itens[index];
          const existingId = rawItem._itemId ? Number(rawItem._itemId) : null;
          if (existingId) {
            await lotesAPI.updateItem(lote.id, existingId, {
              produtor_id: item.produtor_id,
              valor: item.valor,
              data_entrega: item.data_entrega,
              observacao: item.observacao,
            });
          } else {
            await lotesAPI.addItem(lote.id, {
              produtor_id: item.produtor_id,
              valor: item.valor,
              data_entrega: item.data_entrega,
              observacao: item.observacao,
            });
          }
        }
      } else {
        await lotesAPI.create({
          firma_id: values.firma_id,
          data_chegada: values.data_chegada,
          observacao: values.observacao || null,
          itens,
        });
      }

      toast.success(lote ? 'Lote atualizado com sucesso!' : 'Lote de pagamento registrado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const totalLote = form.watch('itens').reduce((sum, item) => {
    const v = parseFloat(item.valor || '0');
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cabeçalho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firma_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? String(field.value) : ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a firma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {firmas.map((firma) => (
                      <SelectItem key={firma.id} value={String(firma.id)}>
                        {firma.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_chegada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Chegada *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações gerais sobre este lote..." {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Produtores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Produtores</h3>
              <p className="text-xs text-muted-foreground">Produtor e valor são opcionais</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => prepend(emptyItem())}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Linha
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`itens.${index}.produtor_id`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Produtor</FormLabel>
                        <Select
                          onValueChange={f.onChange}
                          value={f.value ?? ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {produtores.map((prod) => (
                              <SelectItem key={prod.id} value={String(prod.id)}>
                                {prod.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`itens.${index}.valor`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00 (opcional)"
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`itens.${index}.data_entrega`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Data de Entrega ao Produtor</FormLabel>
                        <FormControl>
                          <Input type="date" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`itens.${index}.observacao`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Observação</FormLabel>
                        <FormControl>
                          <Input placeholder="Obs. deste item..." {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {fields.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        {totalLote > 0 && (
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              Total do lote:{' '}
              <span className="font-semibold text-foreground">
                {totalLote.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : lote ? 'Salvar Alterações' : 'Registrar Pagamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
