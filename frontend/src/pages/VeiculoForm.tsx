import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VeiculoForm from '@/components/forms/VeiculoForm';

export default function VeiculoFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/frota')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Novo Veículo</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre um novo veículo na frota
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
        </CardHeader>
        <CardContent>
          <VeiculoForm
            onSuccess={() => navigate('/frota')}
            onCancel={() => navigate('/frota')}
          />
        </CardContent>
      </Card>
    </div>
  );
}