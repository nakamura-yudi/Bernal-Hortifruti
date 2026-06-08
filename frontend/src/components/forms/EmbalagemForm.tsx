import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
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
import { embalagensAPI } from '@/lib/api';
import { toast } from 'sonner';

const componentSchema = z.object({
  component_id: z.string().min(1, 'Selecione uma embalagem'),
  quantity: z.coerce.number().positive('Quantidade obrigatória'),
});

const embalagemSchema = z.object({
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  preco_unitario: z.string().min(1, 'Preço é obrigatório'),
  components: z.array(componentSchema).default([]),
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
  const [availableEmbalagens, setAvailableEmbalagens] = useState<any[]>([]);

  const form = useForm<EmbalagemFormValues>({
    resolver: zodResolver(embalagemSchema),
    defaultValues: {
      tipo: '',
      preco_unitario: '',
      components: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  useEffect(() => {
    embalagensAPI.list().then((data: any[]) => {
      setAvailableEmbalagens(data.filter((e) => e.id !== embalagemId));
    });
  }, [embalagemId]);

  useEffect(() => {
    if (initialValues) {
      form.reset({
        tipo: initialValues.tipo ?? '',
        preco_unitario: initialValues.preco_unitario ?? '',
        components: initialValues.components ?? [],
      });
    }
  }, [form, initialValues]);

  const onSubmit = async (values: EmbalagemFormValues) => {
    try {
      const payload = {
        name: values.tipo,
        unit_price: parseFloat(values.preco_unitario),
        components: values.components.map((c) => ({
          component_id: parseInt(c.component_id),
          quantity: c.quantity,
        })),
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Embalagens Componentes</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ component_id: '', quantity: 1 })}
            >
              <Plus className="mr-1 h-3 w-3" />
              Adicionar
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum componente vinculado. Use o botão acima para adicionar.
            </p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 rounded-md border p-3">
              <FormField
                control={form.control}
                name={`components.${index}.component_id`}
                render={({ field: f }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">Embalagem</FormLabel>
                    <Select onValueChange={f.onChange} value={f.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableEmbalagens.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.name}
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
                name={`components.${index}.quantity`}
                render={({ field: f }) => (
                  <FormItem className="w-24">
                    <FormLabel className="text-xs">Qtd</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" placeholder="1" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="mb-0.5 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
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
