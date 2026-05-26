import { useEffect, useState } from 'react';
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
import { embalagensAPI, packageDeliveriesAPI, produtoresAPI } from '@/lib/api';
import { toast } from 'sonner';

const deliverySchema = z.object({
  producer_id: z.string().min(1, 'Selecione um produtor'),
  package_type_id: z.string().min(1, 'Selecione a embalagem'),
  quantity: z.coerce.number().positive('Quantidade obrigatoria'),
});

type DeliveryFormValues = z.infer<typeof deliverySchema>;

interface PackageDeliveryFormProps {
  onSuccess?: (delivery?: any) => void;
  onCancel?: () => void;
}

export default function PackageDeliveryForm({ onSuccess, onCancel }: PackageDeliveryFormProps) {
  const [produtores, setProdutores] = useState<any[]>([]);
  const [embalagens, setEmbalagens] = useState<any[]>([]);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      producer_id: '',
      package_type_id: '',
      quantity: 1,
    },
  });

  useEffect(() => {
    loadProdutores();
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

  const loadEmbalagens = async () => {
    try {
      const data = await embalagensAPI.list();
      setEmbalagens(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar embalagens:', error);
    }
  };

  const onSubmit = async (values: DeliveryFormValues) => {
    try {
      const payload = {
        producer_id: Number(values.producer_id),
        package_type_id: Number(values.package_type_id),
        quantity: Number(values.quantity),
      };
      const created = await packageDeliveriesAPI.create(payload);
      toast.success('Envio de embalagem registrado com sucesso!');
      form.reset({ producer_id: '', package_type_id: '', quantity: 1 });
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao registrar envio de embalagem:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar envio de embalagem');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="producer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produtor *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produtor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {produtores.map((produtor) => (
                    <SelectItem key={produtor.id} value={String(produtor.id)}>
                      {produtor.name ?? produtor.nome}
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
          name="package_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Embalagem *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a embalagem" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {embalagens.map((embalagem) => (
                    <SelectItem key={embalagem.id} value={String(embalagem.id)}>
                      {embalagem.name ?? embalagem.tipo}
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
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade *</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
