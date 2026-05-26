-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_unitario NUMERIC NOT NULL,
  unidade_medida TEXT NOT NULL DEFAULT 'un',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Create policies for produtos
CREATE POLICY "Usuários podem ver seus produtos" 
ON public.produtos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus produtos" 
ON public.produtos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus produtos" 
ON public.produtos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus produtos" 
ON public.produtos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de embalagens
CREATE TABLE public.embalagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  capacidade INTEGER NOT NULL,
  preco_unitario NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.embalagens ENABLE ROW LEVEL SECURITY;

-- Create policies for embalagens
CREATE POLICY "Usuários podem ver suas embalagens" 
ON public.embalagens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas embalagens" 
ON public.embalagens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas embalagens" 
ON public.embalagens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas embalagens" 
ON public.embalagens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_embalagens_updated_at
BEFORE UPDATE ON public.embalagens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de relacionamento entre fretes e produtos
CREATE TABLE public.frete_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  frete_id UUID NOT NULL,
  produto_id UUID NOT NULL,
  produtor_id UUID NOT NULL,
  quantidade NUMERIC NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.frete_produtos ENABLE ROW LEVEL SECURITY;

-- Create policies for frete_produtos
CREATE POLICY "Usuários podem ver seus frete_produtos" 
ON public.frete_produtos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus frete_produtos" 
ON public.frete_produtos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus frete_produtos" 
ON public.frete_produtos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus frete_produtos" 
ON public.frete_produtos 
FOR DELETE 
USING (auth.uid() = user_id);