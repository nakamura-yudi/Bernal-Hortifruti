import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TipoManutencaoForm from '@/components/forms/TipoManutencaoForm';
import ManutencaoRealizadaForm from '@/components/forms/ManutencaoRealizadaForm';

export default function Manutencoes() {
  const [openTipo, setOpenTipo] = useState(false);
  const [openRegistrar, setOpenRegistrar] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manutenções</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie as manutenções dos veículos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Dialog open={openTipo} onOpenChange={setOpenTipo}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Wrench className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tipo de Manutenção</span>
                <span className="sm:hidden">Tipo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo tipo de manutenção</DialogTitle>
              </DialogHeader>
              <TipoManutencaoForm
                onSuccess={() => setOpenTipo(false)}
                onCancel={() => setOpenTipo(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={openRegistrar} onOpenChange={setOpenRegistrar}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Registrar Manutenção</span>
                <span className="sm:hidden">Registrar</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar manutenção</DialogTitle>
              </DialogHeader>
              <ManutencaoRealizadaForm
                onSuccess={() => setOpenRegistrar(false)}
                onCancel={() => setOpenRegistrar(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Manutenções</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Funcionalidade em desenvolvimento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
