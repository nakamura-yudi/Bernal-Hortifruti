import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VendaEmbalagemForm from '@/components/forms/VendaEmbalagemForm';

export default function VendaEmbalagemFormPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/embalagens')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Nova Venda de Embalagem</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre uma nova venda de embalagem no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <VendaEmbalagemForm
            onSuccess={() => navigate('/embalagens')}
            onCancel={() => navigate('/embalagens')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
