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
import { toast } from 'sonner';
import { servicesAPI } from '@/lib/api';

const serviceSchema = z.object({
  nome: z.string().min(2, 'Nome e obrigatorio'),
  preco_unitario: z.string().min(1, 'Preco e obrigatorio'),
  ativo: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  serviceId?: number;
  initialValues?: Partial<ServiceFormValues>;
  onSuccess?: (service?: any) => void;
  onCancel?: () => void;
}

export default function ServiceForm({
  serviceId,
  initialValues,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nome: '',
      preco_unitario: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        nome: initialValues.nome ?? '',
        preco_unitario: initialValues.preco_unitario ?? '',
        ativo: initialValues.ativo ?? true,
      });
    }
  }, [form, initialValues]);

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      const payload = {
        name: values.nome,
        unit_price: parseFloat(values.preco_unitario),
        is_active: values.ativo,
      };

      const created = serviceId
        ? await servicesAPI.update(serviceId, payload)
        : await servicesAPI.create(payload);

      toast.success(serviceId ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!');
      form.reset();
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao salvar servico:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar servico');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Emissao de nota" {...field} />
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
              <FormLabel>Preco unitario (R$) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ativo</FormLabel>
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">
            {serviceId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
