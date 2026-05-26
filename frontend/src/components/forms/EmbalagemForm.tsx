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
import { embalagensAPI } from '@/lib/api';
import { toast } from 'sonner';

const embalagemSchema = z.object({
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  preco_unitario: z.string().min(1, 'Preço é obrigatório'),
});

type EmbalagemFormValues = z.infer<typeof embalagemSchema>;

interface EmbalagemFormProps {
  embalagemId?: number;
  initialValues?: Partial<EmbalagemFormValues>;
  onSuccess?: (embalagem?: any) => void;
  onCancel?: () => void;
}

export default function EmbalagemForm({
  embalagemId,
  initialValues,
  onSuccess,
  onCancel,
}: EmbalagemFormProps) {
  const form = useForm<EmbalagemFormValues>({
    resolver: zodResolver(embalagemSchema),
    defaultValues: {
      tipo: '',
      preco_unitario: '',
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        tipo: initialValues.tipo ?? '',
        preco_unitario: initialValues.preco_unitario ?? '',
      });
    }
  }, [form, initialValues]);

  const onSubmit = async (values: EmbalagemFormValues) => {
    try {
      const payload = {
        name: values.tipo,
        unit_price: parseFloat(values.preco_unitario),
      };

      const created = embalagemId
        ? await embalagensAPI.update(embalagemId, payload)
        : await embalagensAPI.create(payload);

      toast.success(
        embalagemId ? 'Embalagem atualizada com sucesso!' : 'Embalagem cadastrada com sucesso!'
      );
      form.reset();
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao cadastrar embalagem:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar embalagem');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Embalagem</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caixa de papelão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preco_unitario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Unitário (R$)</FormLabel>
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
