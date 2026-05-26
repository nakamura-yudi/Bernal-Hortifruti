import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ManutencaoRealizadaForm from '@/components/forms/ManutencaoRealizadaForm';

export default function ManutencaoRealizadaFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/manutencoes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Registrar Manutenção</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Registre uma manutenção realizada em um veículo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <ManutencaoRealizadaForm
            onSuccess={() => navigate('/manutencoes')}
            onCancel={() => navigate('/manutencoes')}
          />
        </CardContent>
      </Card>
    </div>
  );
}