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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { veiculosAPI } from '@/lib/api';
import { toast } from 'sonner';

const veiculoSchema = z.object({
  placa: z.string().min(1, 'Placa é obrigatória'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  ano: z.string().min(1, 'Ano é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  terceiro: z.boolean().default(false),
  km_atual: z.string().min(1, 'Quilometragem é obrigatória'),
  status: z.string().min(1, 'Status é obrigatório'),
  observacoes: z.string().optional(),
});

type VeiculoFormValues = z.infer<typeof veiculoSchema>;

interface VeiculoFormProps {
  onSuccess?: (veiculo?: any) => void;
  onCancel?: () => void;
}

export default function VeiculoForm({ onSuccess, onCancel }: VeiculoFormProps) {
  const form = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      modelo: '',
      marca: '',
      ano: '',
      tipo: 'caminhao',
      terceiro: false,
      km_atual: '0',
      status: 'ativo',
      observacoes: '',
    },
  });

  const onSubmit = async (values: VeiculoFormValues) => {
    try {
      const payload = {
        plate: values.placa.toUpperCase(),
        model: values.modelo,
        brand: values.marca,
        year: parseInt(values.ano, 10),
        type: values.tipo,
        is_third_party: values.terceiro,
        current_km: parseFloat(values.km_atual),
        status: values.status,
        notes: values.observacoes || null,
      };

      const created = await veiculosAPI.create(payload);

      toast.success('Veículo cadastrado com sucesso!');
      form.reset();
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao cadastrar veículo:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar veículo');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder="ABC-1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Veículo</FormLabel>
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
                    <SelectItem value="caminhao">Caminhão</SelectItem>
                    <SelectItem value="carreta">Carreta</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="utilitario">Utilitário</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mercedes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Atego 1719" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="terceiro"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
              <FormLabel className="m-0">Terceiro</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="2024"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="km_atual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem Atual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
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
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre o veículo"
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
