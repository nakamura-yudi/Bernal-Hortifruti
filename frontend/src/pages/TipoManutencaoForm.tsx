import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TipoManutencaoForm from '@/components/forms/TipoManutencaoForm';

export default function TipoManutencaoFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/manutencoes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Novo Tipo de Manutenção</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre um novo tipo de manutenção
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Tipo de Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <TipoManutencaoForm
            onSuccess={() => navigate('/manutencoes')}
            onCancel={() => navigate('/manutencoes')}
          />
        </CardContent>
      </Card>
    </div>
  );
}