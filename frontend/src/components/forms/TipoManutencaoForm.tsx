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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { tiposManutencaoAPI } from '@/lib/api';
import { toast } from 'sonner';

const tipoManutencaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  periodicidade_km: z.string().optional(),
  periodicidade_dias: z.string().optional(),
});

type TipoManutencaoFormValues = z.infer<typeof tipoManutencaoSchema>;

interface TipoManutencaoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TipoManutencaoForm({ onSuccess, onCancel }: TipoManutencaoFormProps) {
  const form = useForm<TipoManutencaoFormValues>({
    resolver: zodResolver(tipoManutencaoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      periodicidade_km: '',
      periodicidade_dias: '',
    },
  });

  const onSubmit = async (values: TipoManutencaoFormValues) => {
    try {
      const payload = {
        nome: values.nome,
        descricao: values.descricao || null,
        periodicidade_km: values.periodicidade_km ? parseInt(values.periodicidade_km) : null,
        periodicidade_dias: values.periodicidade_dias ? parseInt(values.periodicidade_dias) : null,
      };

      await tiposManutencaoAPI.create(payload);

      toast.success('Tipo de manutenção cadastrado com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar tipo de manutenção:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar tipo de manutenção');
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
              <FormLabel>Nome da Manutenção</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Troca de óleo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição detalhada da manutenção"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodicidade_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periodicidade (KM)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 10000"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A cada quantos KM deve ser feita
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodicidade_dias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periodicidade (Dias)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 180"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A cada quantos dias deve ser feita
                </FormDescription>
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