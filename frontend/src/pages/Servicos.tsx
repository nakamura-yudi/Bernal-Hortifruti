import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { servicesAPI } from '@/lib/api';
import ServiceForm from '@/components/forms/ServiceForm';
import { toast } from 'sonner';

export default function Servicos() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await servicesAPI.list();
      setServices(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar servicos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (serviceId: number) => {
    try {
      await servicesAPI.delete(serviceId);
      setServices((prev) => prev.filter((item) => item.id !== serviceId));
      toast.success('Serviço excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir servico:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir servico');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre servicos adicionais cobrados por produto
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo servico</DialogTitle>
            </DialogHeader>
            <ServiceForm
              onSuccess={() => {
                loadServices();
              }}
              onCancel={() => undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de serviços</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum servico cadastrado.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_1fr_1fr_160px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Serviço</span>
                <span>Preco</span>
                <span>Status</span>
                <span className="text-right">Acoes</span>
              </div>
              {services.map((service) => (
                <div
                  key={service.id}
                  className="grid gap-3 rounded-md border px-4 py-3 sm:grid-cols-[2fr_1fr_1fr_160px]"
                >
                  <div>
                    <p className="font-medium text-foreground">{service.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {service.id}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    R$ {Number(service.unit_price ?? 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {service.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Dialog open={openView && selected?.id === service.id} onOpenChange={setOpenView}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setSelected(service);
                            setOpenView(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do servico</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Nome:</strong> {selected.name}</p>
                            <p><strong>Preco:</strong> R$ {Number(selected.unit_price ?? 0).toFixed(2)}</p>
                            <p><strong>Status:</strong> {selected.is_active ? 'Ativo' : 'Inativo'}</p>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openEdit && selected?.id === service.id} onOpenChange={setOpenEdit}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setSelected(service);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar servico</DialogTitle>
                        </DialogHeader>
                        <ServiceForm
                          serviceId={service.id}
                          initialValues={{
                            nome: service.name ?? '',
                            preco_unitario: String(service.unit_price ?? ''),
                            ativo: service.is_active ?? true,
                          }}
                          onSuccess={() => {
                            setOpenEdit(false);
                            loadServices();
                          }}
                          onCancel={() => setOpenEdit(false)}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir servico</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(service.id)}>
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
