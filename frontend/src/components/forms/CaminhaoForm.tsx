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
import { caminhoesAPI } from '@/lib/api';

const caminhaoSchema = z.object({
  plate: z.string().min(1, 'Placa obrigatoria'),
  description: z.string().optional(),
});

type CaminhaoFormValues = z.infer<typeof caminhaoSchema>;

interface CaminhaoFormProps {
  onSuccess?: (caminhao?: any) => void;
  onCancel?: () => void;
}

export default function CaminhaoForm({ onSuccess, onCancel }: CaminhaoFormProps) {
  const form = useForm<CaminhaoFormValues>({
    resolver: zodResolver(caminhaoSchema),
    defaultValues: {
      plate: '',
      description: '',
    },
  });

  const onSubmit = async (values: CaminhaoFormValues) => {
    try {
      const payload = {
        plate: values.plate.toUpperCase(),
        description: values.description || null,
      };
      const created = await caminhoesAPI.create(payload);
      toast.success('Caminhão cadastrado com sucesso!');
      form.reset();
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao cadastrar caminhao:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar caminhao');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa *</FormLabel>
              <FormControl>
                <Input placeholder="ABC-1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descricao</FormLabel>
              <FormControl>
    <Input placeholder="Ex: Caminhão 3/4" {...field} />
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
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
