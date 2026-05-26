import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProdutorForm from '@/components/forms/ProdutorForm';

export default function ProdutorFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/produtores')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Novo Produtor</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre um novo produtor no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Produtor</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutorForm
            onSuccess={() => navigate('/produtores')}
            onCancel={() => navigate('/produtores')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
