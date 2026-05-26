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
import { toast } from 'sonner';
import { companiesAPI } from '@/lib/api';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const isValidCnpj = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string, factors: number[]) => {
    const total = base
      .split('')
      .reduce((sum, n, i) => sum + Number(n) * factors[i], 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcDigit(digits.slice(0, 12) + String(d1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${d1}${d2}`);
};

const firmaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  documento: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .refine((value) => isValidCnpj(value), 'CNPJ inválido'),
  inscricao_estadual: z.string().optional(),
  cidade: z.string().optional(),
  contato: z.string().optional(),
});

type FirmaFormValues = z.infer<typeof firmaSchema>;

interface FirmaFormProps {
  companyId?: number;
  initialValues?: Partial<FirmaFormValues>;
  onSuccess?: (company?: any) => void;
  onCancel?: () => void;
}

export default function FirmaForm({
  companyId,
  initialValues,
  onSuccess,
  onCancel,
}: FirmaFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FirmaFormValues>({
    resolver: zodResolver(firmaSchema),
    defaultValues: {
      nome: '',
      documento: '',
      cidade: '',
      contato: '',
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        nome: initialValues.nome ?? '',
        documento: formatCnpj(initialValues.documento ?? ''),
        inscricao_estadual: initialValues.inscricao_estadual ?? '',
        cidade: initialValues.cidade ?? '',
        contato: initialValues.contato ?? '',
      });
    }
  }, [form, initialValues]);

  const onSubmit = async (values: FirmaFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        name: values.nome,
        document: onlyDigits(values.documento),
        state_registration: values.inscricao_estadual || null,
        city: values.cidade || null,
        contact: values.contato || null,
      };

      const created = companyId
        ? await companiesAPI.update(companyId, payload)
        : await companiesAPI.create(payload);

      toast.success(companyId ? 'Firma atualizada com sucesso!' : 'Firma cadastrada com sucesso!');
      form.reset();
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao cadastrar firma:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar firma');
    } finally {
      setIsLoading(false);
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
                <Input placeholder="Nome da firma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ *</FormLabel>
              <FormControl>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={field.value}
                  onChange={(event) => field.onChange(formatCnpj(event.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inscricao_estadual"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inscricao estadual</FormLabel>
              <FormControl>
                <Input placeholder="Inscricao estadual (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input placeholder="Cidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contato"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato</FormLabel>
              <FormControl>
                <Input placeholder="Telefone ou email" {...field} />
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
