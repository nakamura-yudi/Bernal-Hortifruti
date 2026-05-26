-- Criar tabela de veículos (frota)
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  placa TEXT NOT NULL,
  modelo TEXT NOT NULL,
  marca TEXT NOT NULL,
  ano INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  km_atual NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- Create policies for veiculos
CREATE POLICY "Usuários podem ver seus veículos" 
ON public.veiculos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus veículos" 
ON public.veiculos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus veículos" 
ON public.veiculos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus veículos" 
ON public.veiculos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_veiculos_updated_at
BEFORE UPDATE ON public.veiculos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de tipos de manutenção
CREATE TABLE public.tipos_manutencao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  periodicidade_km INTEGER,
  periodicidade_dias INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipos_manutencao ENABLE ROW LEVEL SECURITY;

-- Create policies for tipos_manutencao
CREATE POLICY "Usuários podem ver seus tipos de manutenção" 
ON public.tipos_manutencao 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus tipos de manutenção" 
ON public.tipos_manutencao 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus tipos de manutenção" 
ON public.tipos_manutencao 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus tipos de manutenção" 
ON public.tipos_manutencao 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tipos_manutencao_updated_at
BEFORE UPDATE ON public.tipos_manutencao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de manutenções realizadas
CREATE TABLE public.manutencoes_realizadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  veiculo_id UUID NOT NULL,
  tipo_manutencao_id UUID NOT NULL,
  data_realizacao DATE NOT NULL,
  km_veiculo NUMERIC NOT NULL,
  valor NUMERIC NOT NULL,
  oficina TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manutencoes_realizadas ENABLE ROW LEVEL SECURITY;

-- Create policies for manutencoes_realizadas
CREATE POLICY "Usuários podem ver suas manutenções" 
ON public.manutencoes_realizadas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas manutenções" 
ON public.manutencoes_realizadas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas manutenções" 
ON public.manutencoes_realizadas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas manutenções" 
ON public.manutencoes_realizadas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manutencoes_realizadas_updated_at
BEFORE UPDATE ON public.manutencoes_realizadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();