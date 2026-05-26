import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmbalagemForm from '@/components/forms/EmbalagemForm';

export default function EmbalagemFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/embalagens')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Nova Embalagem</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre uma nova embalagem no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Embalagem</CardTitle>
        </CardHeader>
        <CardContent>
          <EmbalagemForm
            onSuccess={() => navigate('/embalagens')}
            onCancel={() => navigate('/embalagens')}
          />
        </CardContent>
      </Card>
    </div>
  );
}