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
import { produtoresAPI } from '@/lib/api';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCpfCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const isValidCpf = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcDigit = (base: string, factor: number) => {
    const total = base
      .split('')
      .reduce((sum, n) => sum + Number(n) * factor--, 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(digits.slice(0, 9), 10);
  const d2 = calcDigit(digits.slice(0, 10), 11);
  return digits.endsWith(`${d1}${d2}`);
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

const isValidCpfCnpj = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
};

const produtorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf_cnpj: z
    .string()
    .min(1, 'CPF/CNPJ é obrigatório')
    .refine((value) => isValidCpfCnpj(value), 'CPF/CNPJ inválido'),
  inscricao_estadual: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cidade: z.string().optional(),
});

type ProdutorFormValues = z.infer<typeof produtorSchema>;

interface ProdutorFormProps {
  producerId?: number;
  initialValues?: Partial<ProdutorFormValues>;
  onSuccess?: (producer?: any) => void;
  onCancel?: () => void;
}

export default function ProdutorForm({
  producerId,
  initialValues,
  onSuccess,
  onCancel,
}: ProdutorFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProdutorFormValues>({
    resolver: zodResolver(produtorSchema),
    defaultValues: {
      nome: '',
      cpf_cnpj: '',
      telefone: '',
      email: '',
      cidade: '',
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        nome: initialValues.nome ?? '',
        cpf_cnpj: formatCpfCnpj(initialValues.cpf_cnpj ?? ''),
        inscricao_estadual: initialValues.inscricao_estadual ?? '',
        telefone: initialValues.telefone ?? '',
        email: initialValues.email ?? '',
        cidade: initialValues.cidade ?? '',
      });
    }
  }, [form, initialValues]);

  const onSubmit = async (values: ProdutorFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        name: values.nome,
        document: onlyDigits(values.cpf_cnpj),
        state_registration: values.inscricao_estadual || null,
        city: values.cidade || null,
        contact: values.telefone || values.email || null,
      };

      const created = producerId
        ? await produtoresAPI.update(producerId, payload)
        : await produtoresAPI.create(payload);

      toast.success(producerId ? 'Produtor atualizado com sucesso!' : 'Produtor cadastrado com sucesso!');
      form.reset();
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Erro ao cadastrar produtor:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar produtor');
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
                <Input placeholder="Nome do produtor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpf_cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF/CNPJ *</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={field.value}
                  onChange={(event) => field.onChange(formatCpfCnpj(event.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
