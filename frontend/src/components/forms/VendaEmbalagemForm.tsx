import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { vendasEmbalagensAPI, produtoresAPI } from '@/lib/api';

const vendaEmbalagemSchema = z.object({
  data_venda: z.string().min(1, 'Data é obrigatória'),
  produtor_id: z.string().uuid('Selecione um produtor').optional(),
  tipo_embalagem: z.string().min(1, 'Tipo é obrigatório'),
  quantidade: z.string().min(1, 'Quantidade é obrigatória'),
  valor_unitario: z.string().min(1, 'Valor unitário é obrigatório'),
});

type VendaEmbalagemFormValues = z.infer<typeof vendaEmbalagemSchema>;

interface VendaEmbalagemFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VendaEmbalagemForm({ onSuccess, onCancel }: VendaEmbalagemFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [valorTotal, setValorTotal] = useState('0.00');

  const form = useForm<VendaEmbalagemFormValues>({
    resolver: zodResolver(vendaEmbalagemSchema),
    defaultValues: {
      data_venda: new Date().toISOString().split('T')[0],
      produtor_id: '',
      tipo_embalagem: '',
      quantidade: '',
      valor_unitario: '',
    },
  });

  useEffect(() => {
    loadProdutores();
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const quantidade = parseFloat(value.quantidade || '0');
      const valorUnitario = parseFloat(value.valor_unitario || '0');
      const total = quantidade * valorUnitario;
      setValorTotal(total.toFixed(2));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const loadProdutores = async () => {
    try {
      const data = await produtoresAPI.list();
      setProdutores(data);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
    }
  };

  const onSubmit = async (values: VendaEmbalagemFormValues) => {
    setIsLoading(true);
    try {
      const quantidade = parseInt(values.quantidade);
      const valorUnitario = parseFloat(values.valor_unitario);
      const valorTotal = quantidade * valorUnitario;

      const payload = {
        data_venda: values.data_venda,
        produtor_id: values.produtor_id || null,
        tipo_embalagem: values.tipo_embalagem,
        quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorTotal,
      };

      await vendasEmbalagensAPI.create(payload);

      toast.success('Venda de embalagem cadastrada com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar venda:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar venda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_venda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Venda *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="produtor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produtor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produtor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {produtores.map((produtor) => (
                      <SelectItem key={produtor.id} value={produtor.id}>
                        {produtor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tipo_embalagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Embalagem *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caixa de papelão, Saco plástico" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade *</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor_unitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Unitário *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Valor Total</FormLabel>
            <FormControl>
              <Input value={`R$ ${valorTotal}`} disabled />
            </FormControl>
          </FormItem>
        </div>

        <div className="flex gap-4 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
