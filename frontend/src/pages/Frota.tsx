import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { veiculosAPI } from '@/lib/api';
import VeiculoForm from '@/components/forms/VeiculoForm';
import { toast } from 'sonner';

export default function Frota() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    setIsLoading(true);
    try {
      const data = await veiculosAPI.list();
      setVeiculos(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (veiculoId: number) => {
    try {
      await veiculosAPI.delete(veiculoId);
      setVeiculos((prev) => prev.filter((item) => item.id !== veiculoId));
      toast.success('Veículo excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir veículo:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir veículo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Frota</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie os veículos da frota
          </p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo veículo</DialogTitle>
            </DialogHeader>
            <VeiculoForm
              onSuccess={() => {
                setOpenCreate(false);
                loadVeiculos();
              }}
              onCancel={() => setOpenCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : veiculos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum veículo cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_160px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Veículo</span>
                <span>Tipo</span>
                <span>Status</span>
                <span className="text-right">KM Atual</span>
                <span className="text-right">Ações</span>
              </div>
              {veiculos.map((veiculo) => (
                <div
                  key={veiculo.id}
                  className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_1fr_1fr_1fr_160px]"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {veiculo.model} - {veiculo.plate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {veiculo.brand} · {veiculo.year}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {veiculo.type ?? 'caminhão'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {veiculo.status ?? 'ativo'}
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {Number(veiculo.current_km ?? 0).toFixed(2)} km
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Dialog open={openView && selected?.id === veiculo.id} onOpenChange={setOpenView}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(veiculo);
                            setOpenView(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do veículo</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Placa:</strong> {selected.plate}</p>
                            <p><strong>Modelo:</strong> {selected.model}</p>
                            <p><strong>Marca:</strong> {selected.brand}</p>
                            <p><strong>Ano:</strong> {selected.year}</p>
                            <p><strong>Tipo:</strong> {selected.type}</p>
                            <p><strong>Status:</strong> {selected.status}</p>
                            <p><strong>KM Atual:</strong> {Number(selected.current_km ?? 0).toFixed(2)}</p>
                            <p><strong>Terceiro:</strong> {selected.is_third_party ? 'Sim' : 'Não'}</p>
                            {selected.notes && <p><strong>Observações:</strong> {selected.notes}</p>}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openEdit && selected?.id === veiculo.id} onOpenChange={setOpenEdit}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(veiculo);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar veículo</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <VeiculoForm
                            onSuccess={() => {
                              setOpenEdit(false);
                              loadVeiculos();
                            }}
                            onCancel={() => setOpenEdit(false)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir veículo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(veiculo.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
