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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { manutencoesAPI, veiculosAPI, tiposManutencaoAPI } from '@/lib/api';
import { toast } from 'sonner';

const manutencaoRealizadaSchema = z.object({
  veiculo_id: z.string().min(1, 'Veículo é obrigatório'),
  tipo_manutencao_id: z.string().min(1, 'Tipo de manutenção é obrigatório'),
  data_realizacao: z.string().min(1, 'Data é obrigatória'),
  km_veiculo: z.string().min(1, 'Quilometragem é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  oficina: z.string().optional(),
  observacoes: z.string().optional(),
});

type ManutencaoRealizadaFormValues = z.infer<typeof manutencaoRealizadaSchema>;

interface ManutencaoRealizadaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Veiculo {
  id: number;
  plate: string;
  model: string;
  brand: string;
}

interface TipoManutencao {
  id: number;
  nome: string;
}

export default function ManutencaoRealizadaForm({ onSuccess, onCancel }: ManutencaoRealizadaFormProps) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tiposManutencao, setTiposManutencao] = useState<TipoManutencao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ManutencaoRealizadaFormValues>({
    resolver: zodResolver(manutencaoRealizadaSchema),
    defaultValues: {
      veiculo_id: '',
      tipo_manutencao_id: '',
      data_realizacao: new Date().toISOString().split('T')[0],
      km_veiculo: '',
      valor: '',
      oficina: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [veiculosData, tiposData] = await Promise.all([
        veiculosAPI.list(),
        tiposManutencaoAPI.list(),
      ]);
      const veiculosList = Array.isArray(veiculosData) ? veiculosData : veiculosData?.items ?? [];
      const tiposList = Array.isArray(tiposData) ? tiposData : tiposData?.items ?? [];
      setVeiculos(veiculosList);
      setTiposManutencao(tiposList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: ManutencaoRealizadaFormValues) => {
    try {
      const payload = {
        veiculo_id: Number(values.veiculo_id),
        tipo_manutencao_id: Number(values.tipo_manutencao_id),
        data_realizacao: values.data_realizacao,
        km_veiculo: parseFloat(values.km_veiculo),
        valor: parseFloat(values.valor),
        oficina: values.oficina || null,
        observacoes: values.observacoes || null,
      };

      await manutencoesAPI.create(payload);

      toast.success('Manutenção registrada com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao registrar manutenção:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar manutenção');
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="veiculo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {veiculos.map((veiculo) => (
                      <SelectItem key={veiculo.id} value={String(veiculo.id)}>
                        {veiculo.plate} - {veiculo.brand} {veiculo.model}
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
            name="tipo_manutencao_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Manutenção</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiposManutencao.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
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
            name="data_realizacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Realização</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="km_veiculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KM do Veículo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Quilometragem atual"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
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
            name="oficina"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Oficina</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da oficina" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre a manutenção realizada"
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
