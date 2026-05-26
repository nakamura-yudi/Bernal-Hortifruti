import { useEffect, useState } from 'react';
import { Plus, TrendingUp, Package, DollarSign, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface KPIData {
  totalFretes: number;
  fretesAbertos: number;
  fretesEmTransito: number;
  fretesConcluidos: number;
  receitaBruta: number;
  custoFixo: number;
  embalagensVendidas: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis] = useState<KPIData>({
    totalFretes: 0,
    fretesAbertos: 0,
    fretesEmTransito: 0,
    fretesConcluidos: 0,
    receitaBruta: 0,
    custoFixo: 0,
    embalagensVendidas: 0,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Visão geral das operações Bernal Hortifruti
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/fretes')} className="flex-1 sm:flex-initial">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo Frete</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Fretes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalFretes}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-primary">{kpis.fretesAbertos}</span> abertos,{' '}
              <span className="text-blue-600">{kpis.fretesEmTransito}</span> em trânsito,{' '}
              <span className="text-green-600">{kpis.fretesConcluidos}</span> concluídos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Bruta
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.receitaBruta)}</div>
            <p className="text-xs text-muted-foreground mt-1">Período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Fixo Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.custoFixo)}</div>
            <p className="text-xs text-muted-foreground mt-1">Mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Embalagens Vendidas
            </CardTitle>
            <Box className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.embalagensVendidas}</div>
            <p className="text-xs text-muted-foreground mt-1">Período atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Fretes */}
      <Card>
        <CardHeader>
          <CardTitle>Fretes Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground py-8">
              Nenhum frete encontrado. Comece criando seu primeiro frete!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/fretes')}>
          <CardHeader>
            <CardTitle className="text-base">Criar Frete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Registrar um novo frete no sistema
            </p>
          </CardContent>
        </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/manutencoes')}>
          <CardHeader>
            <CardTitle className="text-base">Registrar Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adicionar registro de manutenção de veículo
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/embalagens')}>
          <CardHeader>
            <CardTitle className="text-base">Vender Embalagem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Registrar venda de embalagem
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
