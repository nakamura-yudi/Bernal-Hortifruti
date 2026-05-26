import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FreteForm from '@/components/forms/FreteForm';

export default function FreteFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/fretes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Novo Frete</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre um novo frete no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Frete</CardTitle>
        </CardHeader>
        <CardContent>
          <FreteForm
            onSuccess={() => navigate('/fretes')}
            onCancel={() => navigate('/fretes')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
