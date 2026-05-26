import { useEffect } from 'react';
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
import { freightRatesAPI, produtosAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tarifa_frete: z.string().min(1, 'Tarifa do frete é obrigatória'),
  unidade_medida: z.string().min(1, 'Unidade de medida é obrigatória'),
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  productId?: number;
  rateId?: number | null;
  initialValues?: Partial<ProdutoFormValues>;
  onSuccess?: (product?: any) => void;
  onCancel?: () => void;
}

export default function ProdutoForm({
  productId,
  rateId,
  initialValues,
  onSuccess,
  onCancel,
}: ProdutoFormProps) {
  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      tarifa_frete: '',
      unidade_medida: 'un',
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        nome: initialValues.nome ?? '',
        tarifa_frete: initialValues.tarifa_frete ?? '',
        unidade_medida: initialValues.unidade_medida ?? 'un',
      });
    }
  }, [form, initialValues]);

  const onSubmit = async (values: ProdutoFormValues) => {
    try {
      const payload = {
        name: values.nome,
        default_unit: values.unidade_medida,
      };

      const product = productId
        ? await produtosAPI.update(productId, payload)
        : await produtosAPI.create(payload);

      const ratePayload = {
        product_id: product.id,
        rate_per_unit: parseFloat(values.tarifa_frete),
      };

      if (productId && rateId) {
        await freightRatesAPI.update(rateId, ratePayload);
      } else {
        await freightRatesAPI.create(ratePayload);
      }

      toast.success(productId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      form.reset();
      onSuccess?.(product);
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar produto');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Laranja" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tarifa_frete"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarifa do Frete (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidade_medida"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Medida</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="cx">Caixa (cx)</SelectItem>
                    <SelectItem value="sc">Saco (sc)</SelectItem>
                    <SelectItem value="l">Litro (l)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
