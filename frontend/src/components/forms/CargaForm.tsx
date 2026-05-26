import { useEffect, useMemo, useState } from 'react';
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
import { cargasAPI, fretesAPI, veiculosAPI } from '@/lib/api';
import { toast } from 'sonner';

const cargaSchema = z.object({
  load_date: z.string().min(1, 'Data obrigatoria'),
  veiculo_id: z.string().min(1, 'Selecione um caminhão'),
  km_traveled: z.coerce.number().min(0),
  fuel_liters: z.coerce.number().min(0),
  toll_amount: z.coerce.number().min(0),
  diesel_amount: z.coerce.number().min(0),
  driver_name: z.string().optional(),
  is_third_party: z.boolean().default(false),
  third_party_freight_value: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
  frete_ids: z.array(z.number()).optional(),
});

type CargaFormValues = z.infer<typeof cargaSchema>;

interface CargaFormProps {
  cargaId?: number;
  initialValues?: Partial<CargaFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CargaForm({ cargaId, initialValues, onSuccess, onCancel }: CargaFormProps) {
  const [caminhoes, setCaminhoes] = useState<any[]>([]);
  const [fretes, setFretes] = useState<any[]>([]);

  const form = useForm<CargaFormValues>({
    resolver: zodResolver(cargaSchema),
    defaultValues: {
      load_date: '',
      veiculo_id: '',
      km_traveled: 0,
      fuel_liters: 0,
      toll_amount: 0,
      diesel_amount: 0,
      driver_name: '',
      is_third_party: false,
      third_party_freight_value: 0,
      frete_ids: [],
    },
  });

  useEffect(() => {
    loadCaminhoes();
    loadFretes();
  }, []);

  useEffect(() => {
    if (initialValues) {
      form.reset({
        load_date: initialValues.load_date ?? '',
        veiculo_id: initialValues.veiculo_id ? String(initialValues.veiculo_id) : '',
        km_traveled: Number(initialValues.km_traveled ?? 0),
        fuel_liters: Number(initialValues.fuel_liters ?? 0),
        toll_amount: Number(initialValues.toll_amount ?? 0),
        diesel_amount: Number(initialValues.diesel_amount ?? 0),
        driver_name: initialValues.driver_name ?? '',
        is_third_party: initialValues.is_third_party ?? false,
        third_party_freight_value: Number(initialValues.third_party_freight_value ?? 0),
        frete_ids: initialValues.frete_ids ?? [],
      });
    }
  }, [form, initialValues]);

  useEffect(() => {
    if (!initialValues?.veiculo_id) {
      return;
    }
    form.setValue('veiculo_id', String(initialValues.veiculo_id));
  }, [form, initialValues?.veiculo_id, caminhoes.length]);

  const selectedVeiculo = caminhoes.find((item) => String(item.id) === form.watch('veiculo_id'));

  useEffect(() => {
    const isThirdParty = selectedVeiculo?.is_third_party ?? false;
    form.setValue('is_third_party', isThirdParty);
    if (isThirdParty) {
      form.setValue('km_traveled', 0);
      form.setValue('fuel_liters', 0);
      form.setValue('toll_amount', 0);
      form.setValue('diesel_amount', 0);
    } else {
      form.setValue('third_party_freight_value', 0);
    }
  }, [form, selectedVeiculo?.is_third_party]);

  const loadCaminhoes = async () => {
    try {
      const data = await veiculosAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setCaminhoes(list.filter((item) => item.type === 'caminhao'));
    } catch (error) {
      console.error('Erro ao carregar caminhoes:', error);
    }
  };

  const loadFretes = async () => {
    try {
      const data = await fretesAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setFretes(list);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
    }
  };

  const availableFretes = useMemo(() => {
    return fretes.filter((frete) => !frete.carga_id);
  }, [fretes]);

  const onSubmit = async (values: CargaFormValues) => {
    try {
      const payload = {
        load_date: values.load_date,
        veiculo_id: Number(values.veiculo_id),
        km_traveled: Number(values.km_traveled),
        fuel_liters: Number(values.fuel_liters),
        toll_amount: Number(values.toll_amount),
        diesel_amount: Number(values.diesel_amount),
        driver_name: values.driver_name?.trim() || null,
        is_third_party: values.is_third_party,
        third_party_freight_value: values.is_third_party ? Number(values.third_party_freight_value ?? 0) : 0,
        status: values.status ?? 'aberta',
        frete_ids: values.frete_ids ?? [],
      };
      if (cargaId) {
        await cargasAPI.update(cargaId, payload);
        toast.success('Carga atualizada com sucesso!');
      } else {
        await cargasAPI.create(payload);
        toast.success('Carga cadastrada com sucesso!');
      }
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar carga:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar carga');
    }
  };

  const selectedFretes = form.watch('frete_ids') ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="load_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da carga *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="veiculo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caminhão *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o caminhão" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {caminhoes.map((caminhao) => (
                      <SelectItem key={caminhao.id} value={String(caminhao.id)}>
                        {caminhao.model} - {caminhao.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="driver_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motorista</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do motorista" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="km_traveled"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km percorrido</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={form.watch('is_third_party')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuel_liters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Combustível gasto (L)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={form.watch('is_third_party')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="toll_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pedágio pago (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={form.watch('is_third_party')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="diesel_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diesel pago (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={form.watch('is_third_party')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch('is_third_party') && (
          <FormField
            control={form.control}
            name="third_party_freight_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do frete terceirizado (R$)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="frete_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fretes da carga</FormLabel>
              {availableFretes.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableFretes.map((frete) => {
                    const checked = selectedFretes.includes(frete.id);
                    return (
                      <label key={frete.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              field.onChange([...(field.value ?? []), frete.id]);
                            } else {
                              field.onChange((field.value ?? []).filter((id: number) => id !== frete.id));
                            }
                          }}
                        />
                        <span>Frete #{frete.id}</span>
                      </label>
                    );
                  })}
                </div>
              )}
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
