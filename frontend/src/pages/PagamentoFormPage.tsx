import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PagamentoForm from '@/components/forms/PagamentoForm';
import { lotesAPI } from '@/lib/api';

export default function PagamentoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [lote, setLote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      lotesAPI.get(Number(id))
        .then(setLote)
        .catch(() => navigate('/pagamentos'))
        .finally(() => setIsLoading(false));
    }
  }, [id, navigate]);

  if (id && isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pagamentos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {lote ? 'Editar Lote de Pagamento' : 'Novo Lote de Pagamento'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {lote
              ? 'Edite os dados do cabeçalho do lote'
              : 'Selecione a firma, informe a data de chegada e adicione os produtores'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <PagamentoForm
            lote={lote}
            onSuccess={() => navigate('/pagamentos')}
            onCancel={() => navigate('/pagamentos')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
