import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Plus, Calendar, Truck, Eye, Pencil, Trash2, CheckCircle2, Copy } from 'lucide-react';
import { cargasAPI, veiculosAPI } from '@/lib/api';
import CargaForm from '@/components/forms/CargaForm';
import { toast } from 'sonner';

export default function Cargas() {
  const [cargas, setCargas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [caminhoes, setCaminhoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openClone, setOpenClone] = useState(false);

  useEffect(() => {
    loadCargas();
    loadCaminhoes();
  }, []);

  const loadCargas = async () => {
    setIsLoading(true);
    try {
      const data = await cargasAPI.list();
      setCargas(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar cargas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaminhoes = async () => {
    try {
      const data = await veiculosAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setCaminhoes(list.filter((item) => item.type === 'caminhao'));
    } catch (error) {
      console.error('Erro ao carregar caminhoes:', error);
    }
  };

  const caminhaoLabel = (id?: number) => {
    if (!id) {
      return 'Caminhão';
    }
    const caminhao = caminhoes.find((item) => item.id === id);
    if (!caminhao) {
      return 'Caminhão';
    }
    return `${caminhao.plate} - ${caminhao.brand} ${caminhao.model}`;
  };

  const todayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeDate = (value?: string) => {
    if (!value) {
      return '';
    }
    return value.includes('T') ? value.slice(0, 10) : value;
  };

  const formatDateBr = (value?: string) => {
    const normalized = normalizeDate(value);
    if (!normalized || normalized.length !== 10) {
      return '';
    }
    return `${normalized.slice(8, 10)}/${normalized.slice(5, 7)}/${normalized.slice(0, 4)}`;
  };

  const isCargaEncerrada = (status?: string) => {
    const normalizedStatus = status?.toLowerCase();
    return normalizedStatus === 'concluida' || normalizedStatus === 'encerrada';
  };

  const statusLabel = (status?: string) => {
    if (isCargaEncerrada(status)) {
      return 'Encerrada';
    }
    return 'Aberta';
  };

  const cargaSequenceMap = useMemo(() => {
    const map = new Map<number, number>();
    const byDate = new Map<string, any[]>();
    cargas.forEach((carga) => {
      const dateKey = normalizeDate(carga.load_date);
      if (!dateKey) {
        return;
      }
      const list = byDate.get(dateKey) ?? [];
      list.push(carga);
      byDate.set(dateKey, list);
    });
    byDate.forEach((list) => {
      list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      list.forEach((carga, index) => {
        map.set(carga.id, index + 1);
      });
    });
    return map;
  }, [cargas]);

  const cargaLabel = (carga: any) => {
    const dateLabel = formatDateBr(carga.load_date) || 'Data';
    const sequence = cargaSequenceMap.get(carga.id) ?? 0;
    const sequenceLabel = String(sequence).padStart(2, '0');
    return `Carga - ${dateLabel}-${sequenceLabel}`;
  };

  const filteredCargas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return cargas;
    }
    return cargas.filter((carga) => {
      const content = [
        carga.id,
        carga.load_date,
        carga.status,
        carga.driver_name,
        caminhaoLabel(carga.veiculo_id),
        carga.is_third_party ? 'terceiro' : 'frota propria',
      ]
        .join(' ')
        .toLowerCase();
      return content.includes(term);
    });
  }, [cargas, search, caminhoes]);

  const handleDelete = async (cargaId: number) => {
    try {
      await cargasAPI.delete(cargaId);
      setCargas((prev) => prev.filter((item) => item.id !== cargaId));
      toast.success('Carga excluida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir carga:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir carga');
    }
  };

  const handleConcluir = async (cargaId: number) => {
    try {
      await cargasAPI.updateStatus(cargaId, 'concluida');
      setCargas((prev) =>
        prev.map((item) => (item.id === cargaId ? { ...item, status: 'concluida' } : item)),
      );
      toast.success('Carga concluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao concluir carga:', error);
      toast.error(error.response?.data?.message || 'Erro ao concluir carga');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Cargas
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Controle de cargas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Organize os fretes por carga e dia de carregamento.
            </p>
          </div>
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nova Carga
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova carga</DialogTitle>
              </DialogHeader>
              <CargaForm
                onSuccess={() => {
                  setOpenModal(false);
                  loadCargas();
                }}
                onCancel={() => setOpenModal(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Cargas cadastradas</CardTitle>
          <Input
            placeholder="Buscar por carga, data, status ou caminhão..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredCargas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma carga cadastrada.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredCargas.map((carga) => (
                <div
                  key={carga.id}
                  className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {cargaLabel(carga)}
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {caminhaoLabel(carga.veiculo_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {carga.is_third_party ? 'Terceiro' : 'Frota própria'}
                    </p>
                    {carga.driver_name && (
                      <p className="text-sm text-muted-foreground">
                        Motorista: {carga.driver_name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Status: {statusLabel(carga.status)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {carga.load_date
                        ? new Date(carga.load_date).toLocaleDateString()
                        : 'Sem data'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>{Number(carga.km_traveled ?? 0).toFixed(2)} km</span>
                    </div>
                    <div>Combustível: {Number(carga.fuel_liters ?? 0).toFixed(2)} L</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Pedágio: R$ {Number(carga.toll_amount ?? 0).toFixed(2)}</div>
                    <div>Diesel: R$ {Number(carga.diesel_amount ?? 0).toFixed(2)}</div>
                    {carga.is_third_party && (
                      <div>Frete terceiro: R$ {Number(carga.third_party_freight_value ?? 0).toFixed(2)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Dialog open={openView && selected?.id === carga.id} onOpenChange={setOpenView}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(carga);
                            setOpenView(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da carga</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-2 text-sm">
                            <p><strong>Data:</strong> {selected.load_date}</p>
                            <p><strong>Caminhão:</strong> {caminhaoLabel(selected.veiculo_id)}</p>
                            <p><strong>Motorista:</strong> {selected.driver_name || 'Nao informado'}</p>
                            <p><strong>Status:</strong> {statusLabel(selected.status)}</p>
                            <p><strong>Km:</strong> {Number(selected.km_traveled ?? 0).toFixed(2)}</p>
                            <p><strong>Combustível:</strong> {Number(selected.fuel_liters ?? 0).toFixed(2)} L</p>
                            <p><strong>Pedágio:</strong> R$ {Number(selected.toll_amount ?? 0).toFixed(2)}</p>
                            <p><strong>Diesel:</strong> R$ {Number(selected.diesel_amount ?? 0).toFixed(2)}</p>
                            {selected.is_third_party && (
                              <p><strong>Frete terceiro:</strong> R$ {Number(selected.third_party_freight_value ?? 0).toFixed(2)}</p>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openClone && selected?.id === carga.id} onOpenChange={setOpenClone}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(carga);
                            setOpenClone(true);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Clonar carga</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <CargaForm
                            initialValues={{
                              load_date: todayISO(),
                              veiculo_id: String(selected.veiculo_id ?? ''),
                              km_traveled: Number(selected.km_traveled ?? 0),
                              fuel_liters: Number(selected.fuel_liters ?? 0),
                              toll_amount: Number(selected.toll_amount ?? 0),
                              diesel_amount: Number(selected.diesel_amount ?? 0),
                              driver_name: selected.driver_name ?? '',
                              is_third_party: selected.is_third_party ?? false,
                              third_party_freight_value: Number(selected.third_party_freight_value ?? 0),
                              status: 'aberta',
                              frete_ids: [],
                            }}
                            onSuccess={() => {
                              setOpenClone(false);
                              loadCargas();
                            }}
                            onCancel={() => setOpenClone(false)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openEdit && selected?.id === carga.id} onOpenChange={setOpenEdit}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelected(carga);
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar carga</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <CargaForm
                            cargaId={selected.id}
                            initialValues={{
                              load_date: selected.load_date ?? '',
                              veiculo_id: String(selected.veiculo_id ?? ''),
                              km_traveled: Number(selected.km_traveled ?? 0),
                              fuel_liters: Number(selected.fuel_liters ?? 0),
                              toll_amount: Number(selected.toll_amount ?? 0),
                              diesel_amount: Number(selected.diesel_amount ?? 0),
                              driver_name: selected.driver_name ?? '',
                              is_third_party: selected.is_third_party ?? false,
                              third_party_freight_value: Number(selected.third_party_freight_value ?? 0),
                              status: selected.status ?? 'aberta',
                              frete_ids: selected.frete_ids ?? [],
                            }}
                            onSuccess={() => {
                              setOpenEdit(false);
                              loadCargas();
                            }}
                            onCancel={() => setOpenEdit(false)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    {!isCargaEncerrada(carga.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Concluir carga</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja concluir esta carga? Depois de concluída, ela não aparece como ativa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleConcluir(carga.id)}>
                              Concluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir carga</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(carga.id)}>
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
