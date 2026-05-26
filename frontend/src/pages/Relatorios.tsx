import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cargasAPI, reportsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Download, Eye, Plus, Trash2 } from 'lucide-react';

type Carga = {
  id: number;
  load_date: string;
  status: string;
};

type ReportItem = {
  producer_id: number;
  producer_name: string;
  product_id: number;
  product_name: string;
  package_type_id?: number | null;
  package_type_name: string;
  quantity: number;
};

type ReportCompany = {
  company_id: number;
  company_name: string;
  items: ReportItem[];
};

type UnloadingReport = {
  carga_id: number;
  load_date: string;
  status: string;
  created_at: string;
  vehicle_plate?: string | null;
  driver_name?: string | null;
  companies: ReportCompany[];
};

type PaymentReportItem = {
  producer_id: number;
  producer_name: string;
  product_id: number;
  product_name: string;
  package_type_id?: number | null;
  package_type_name: string;
  quantity: number;
  total_amount: number;
};

type PaymentReportCarga = {
  carga_id: number;
  load_date: string;
};

type PaymentReportCompany = {
  company_id: number;
  company_name: string;
  items: PaymentReportItem[];
};

type PaymentReport = {
  carga_ids: number[];
  cargas: PaymentReportCarga[];
  companies: PaymentReportCompany[];
};

type ReportHistoryItem = {
  id: number;
  report_type: string;
  parameters: Record<string, unknown>;
  created_at: string;
};

type ReportHistoryDetail = ReportHistoryItem & {
  result_data: Record<string, unknown>;
};

type UnloadingHistoryRow = {
  producer_name: string;
  product_name: string;
  package_type_name: string;
  quantity: number;
};

type UnloadingHistoryGroup = {
  company_name: string;
  items: UnloadingHistoryRow[];
};

type PaymentHistoryRow = {
  producer_name: string;
  product_name: string;
  package_type_name: string;
  quantity: number;
  total_amount: number;
};

type PaymentHistoryGroup = {
  company_name: string;
  items: PaymentHistoryRow[];
};

type ComboOption = {
  value: string;
  label: string;
};

interface SearchComboboxProps {
  value: string;
  options: ComboOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

function SearchCombobox({ value, options, placeholder, onChange }: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selected?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar carga..." />
          <CommandEmpty>Nenhuma carga encontrada.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === option.value ? 'opacity-100' : 'opacity-0'}`} />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const formatDateBr = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('pt-BR');
};

const formatDateTimeBr = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('pt-BR');
};

const formatCargaDatesText = (cargas?: Array<{ carga_id: number; load_date: string }>) => {
  if (!Array.isArray(cargas) || cargas.length === 0) {
    return 'Datas não informadas';
  }

  return cargas
    .map((carga) => `Carga #${carga.carga_id}: ${formatDateBr(carga.load_date)}`)
    .join(', ');
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const parseUnloadingHistoryGroups = (resultData: Record<string, unknown>): UnloadingHistoryGroup[] => {
  const data = resultData as any;
  if (!Array.isArray(data?.companies)) {
    return [];
  }

  return data.companies.map((company: any) => ({
    company_name: String(company?.company_name ?? ''),
    items: Array.isArray(company?.items)
      ? company.items.map((item: any) => ({
          producer_name: String(item?.producer_name ?? ''),
          product_name: String(item?.product_name ?? ''),
          package_type_name: String(item?.package_type_name ?? ''),
          quantity: Number(item?.quantity ?? 0),
        }))
      : [],
  }));
};

const parsePaymentHistoryGroups = (resultData: Record<string, unknown>): PaymentHistoryGroup[] => {
  const data = resultData as any;
  if (!Array.isArray(data?.companies)) {
    return [];
  }

  return data.companies.map((company: any) => {
    if (Array.isArray(company?.items)) {
      return {
        company_name: String(company?.company_name ?? ''),
        items: company.items.map((item: any) => ({
          producer_name: String(item?.producer_name ?? ''),
          product_name: String(item?.product_name ?? ''),
          package_type_name: String(item?.package_type_name ?? ''),
          quantity: Number(item?.quantity ?? 0),
          total_amount: Number(item?.total_amount ?? 0),
        })),
      };
    }

    return {
      company_name: String(company?.company_name ?? ''),
      items: [
        {
          producer_name: '',
          product_name: '',
          package_type_name: '',
          quantity: Number(company?.fretes_count ?? 0),
          total_amount: Number(company?.total_amount ?? 0),
        },
      ],
    };
  });
};

export default function Relatorios() {
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyActionId, setHistoryActionId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<ReportHistoryDetail | null>(null);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [selectedCargaId, setSelectedCargaId] = useState<string>('');
  const [report, setReport] = useState<UnloadingReport | null>(null);
  const [selectedPaymentCargaIds, setSelectedPaymentCargaIds] = useState<number[]>([]);
  const [paymentCargaToAdd, setPaymentCargaToAdd] = useState<string>('');
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    loadCargas();
    loadReportHistory();
  }, []);

  const loadCargas = async () => {
    setIsLoading(true);
    try {
      const data = await cargasAPI.list();
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setCargas(list);
      if (list.length > 0) {
        setSelectedCargaId(String(list[0].id));
      }
    } catch (error) {
      console.error('Erro ao carregar cargas:', error);
      toast.error('Erro ao carregar cargas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnloadingReport = async (cargaId: number) => {
    setIsLoading(true);
    try {
      const data = await reportsAPI.unloadingByCarga(cargaId);
      setReport(data);
      await loadReportHistory();
    } catch (error: any) {
      console.error('Erro ao carregar relatório:', error);
      setReport(null);
      toast.error(error.response?.data?.detail || 'Erro ao carregar relatório de descarregamento');
    } finally {
      setIsLoading(false);
    }
  };

  const generateUnloadingReport = async () => {
    if (!selectedCargaId) {
      toast.error('Selecione uma carga');
      return;
    }
    await loadUnloadingReport(Number(selectedCargaId));
  };

  const addPaymentCarga = () => {
    const cargaId = Number(paymentCargaToAdd);
    if (!cargaId) {
      return;
    }
    setSelectedPaymentCargaIds((prev) => (prev.includes(cargaId) ? prev : [...prev, cargaId]));
    setPaymentCargaToAdd('');
  };

  const removePaymentCarga = (cargaId: number) => {
    setSelectedPaymentCargaIds((prev) => prev.filter((id) => id !== cargaId));
  };

  const loadPaymentReport = async () => {
    if (selectedPaymentCargaIds.length === 0) {
      toast.error('Selecione pelo menos uma carga');
      return;
    }

    setIsLoading(true);
    try {
      const data = await reportsAPI.paymentByCargas(selectedPaymentCargaIds);
      setPaymentReport(data);
      await loadReportHistory();
    } catch (error: any) {
      console.error('Erro ao carregar relatório de pagamento:', error);
      setPaymentReport(null);
      toast.error(error.response?.data?.detail || 'Erro ao carregar relatório de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await reportsAPI.history(100);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar histórico de relatórios:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const formatHistoryType = (reportType: string) => {
    if (reportType === 'unloading') {
      return 'Descarregamento';
    }
    if (reportType === 'payment') {
      return 'Pagamento';
    }
    return reportType;
  };

  const formatHistoryParams = (item: ReportHistoryItem) => {
    if (item.report_type === 'unloading') {
      const cargaId = Number(item.parameters?.carga_id || 0);
      return cargaId ? `Carga #${cargaId}` : 'Sem parâmetros';
    }
    if (item.report_type === 'payment') {
      const ids = Array.isArray(item.parameters?.carga_ids)
        ? (item.parameters.carga_ids as unknown[])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0)
        : [];
      if (ids.length === 0) {
        return 'Sem cargas selecionadas';
      }
      return `Cargas: ${ids.map((id) => `#${id}`).join(', ')}`;
    }
    return 'Parâmetros não mapeados';
  };

  const fetchHistoryDetail = async (reportId: number): Promise<ReportHistoryDetail | null> => {
    try {
      const data = await reportsAPI.historyById(reportId);
      return data;
    } catch (error: any) {
      console.error('Erro ao carregar detalhe do relatório:', error);
      toast.error(error.response?.data?.detail || 'Erro ao carregar relatório salvo');
      return null;
    }
  };

  const openHistoryPreview = async (reportId: number) => {
    setHistoryActionId(reportId);
    const detail = await fetchHistoryDetail(reportId);
    setHistoryActionId(null);
    if (!detail) {
      return;
    }
    setSelectedHistoryDetail(detail);
    setIsPreviewOpen(true);
  };

  const deleteHistoryReport = async (reportId: number) => {
    const confirmed = window.confirm('Deseja excluir este relatório do histórico?');
    if (!confirmed) {
      return;
    }

    setHistoryActionId(reportId);
    try {
      await reportsAPI.deleteHistory(reportId);
      setHistory((prev) => prev.filter((item) => item.id !== reportId));
      if (selectedHistoryDetail?.id === reportId) {
        setSelectedHistoryDetail(null);
        setIsPreviewOpen(false);
      }
      toast.success('Relatório excluído do histórico');
    } catch (error: any) {
      console.error('Erro ao excluir relatório do histórico:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir relatório');
    } finally {
      setHistoryActionId(null);
    }
  };

  const buildHistoryPrintableHtml = (detail: ReportHistoryDetail) => {
    const title =
      detail.report_type === 'unloading' ? 'Relatorio de Descarregamento' : 'Relatorio de Pagamento';

    if (detail.report_type === 'unloading') {
      const cargaCreatedAt = String((detail.result_data as any)?.created_at ?? '');
      const vehiclePlate = String((detail.result_data as any)?.vehicle_plate ?? '');
      const driverName = String((detail.result_data as any)?.driver_name ?? '');
      const groups = parseUnloadingHistoryGroups(detail.result_data);
      const rowsHtml = groups
        .map(
          (group) => `
            <div style="margin-top:16px">
              <table>
                <tbody>
                  <tr>
                    <td style="font-weight:700;color:#6b7280;width:25%">FIRMA</td>
                    <td style="font-weight:700">${escapeHtml(group.company_name)}</td>
                  </tr>
                </tbody>
              </table>
              <table>
                <thead>
                  <tr>
                    <th>Produtor</th>
                    <th>Produto</th>
                    <th>Embalagem</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.items
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.producer_name)}</td>
                          <td>${escapeHtml(row.product_name)}</td>
                          <td>${escapeHtml(row.package_type_name)}</td>
                          <td style="text-align:right">${Number(row.quantity).toFixed(2)}</td>
                        </tr>
                      `,
                    )
                    .join('')}
                  <tr>
                    <td colspan="3" style="font-weight:700">Subtotal</td>
                    <td style="text-align:right;font-weight:700">${group.items.reduce((sum, row) => sum + Number(row.quantity), 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `,
        )
        .join('');

      return `
        <html>
          <head>
            <title>${escapeHtml(title)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
              h1 { margin: 0 0 6px 0; font-size: 20px; }
              p { margin: 0 0 6px 0; font-size: 13px; color: #4b5563; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
              th { text-align: left; background: #f3f4f6; }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(title)}</h1>
            <p><strong>Data de formacao da carga:</strong> ${escapeHtml(formatDateTimeBr(cargaCreatedAt) || 'Nao informada')}</p>
            <p><strong>Placa:</strong> ${escapeHtml(vehiclePlate || 'Nao informada')}</p>
            <p><strong>Motorista:</strong> ${escapeHtml(driverName || 'Nao informado')}</p>
            ${rowsHtml}
          </body>
        </html>
      `;
    }

    const paymentCargas = Array.isArray((detail.result_data as any)?.cargas)
      ? ((detail.result_data as any).cargas as Array<{ carga_id: number; load_date: string }>)
      : [];
    const groups = parsePaymentHistoryGroups(detail.result_data);
    const rowsHtml = groups
      .map(
        (group) => `
          <div style="margin-top:16px">
            <table>
              <tbody>
                <tr>
                  <td style="font-weight:700;color:#6b7280;width:25%">FIRMA</td>
                  <td style="font-weight:700">${escapeHtml(group.company_name)}</td>
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Produtor</th>
                  <th>Produto</th>
                  <th>Embalagem</th>
                  <th>Quantidade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${group.items
                  .map(
                    (row) => `
                      <tr>
                        <td>${escapeHtml(row.producer_name || '-')}</td>
                        <td>${escapeHtml(row.product_name || '-')}</td>
                        <td>${escapeHtml(row.package_type_name || '-')}</td>
                        <td style="text-align:right">${Number(row.quantity).toFixed(2)}</td>
                        <td style="text-align:right">${Number(row.total_amount).toFixed(2)}</td>
                      </tr>
                    `,
                  )
                  .join('')}
                <tr>
                  <td colspan="3" style="font-weight:700">Subtotal</td>
                  <td style="text-align:right;font-weight:700">${group.items.reduce((sum, row) => sum + Number(row.quantity), 0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      )
      .join('');

    return `
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 6px 0; font-size: 20px; }
            p { margin: 0 0 6px 0; font-size: 13px; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
            th { text-align: left; background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <p><strong>Datas das cargas:</strong> ${escapeHtml(formatCargaDatesText(paymentCargas))}</p>
          ${rowsHtml}
        </body>
      </html>
    `;
  };

  const downloadHistoryPdf = async (reportId: number) => {
    setHistoryActionId(reportId);
    const detail = await fetchHistoryDetail(reportId);
    setHistoryActionId(null);
    if (!detail) {
      return;
    }

    try {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.position = 'fixed';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.style.right = '0';
      frame.style.bottom = '0';
      document.body.appendChild(frame);

      frame.onload = () => {
        const win = frame.contentWindow;
        if (!win) {
          toast.error('Não foi possível gerar o PDF');
          document.body.removeChild(frame);
          return;
        }
        win.focus();
        win.print();
        setTimeout(() => {
          if (document.body.contains(frame)) {
            document.body.removeChild(frame);
          }
        }, 1500);
      };

      frame.srcdoc = buildHistoryPrintableHtml(detail);
    } catch (error) {
      console.error('Erro ao preparar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const reportSummary = useMemo(() => {
    if (!report) {
      return { companies: 0, lines: 0, quantity: 0 };
    }
    const companies = report.companies.length;
    const lines = report.companies.reduce((sum, company) => sum + company.items.length, 0);
    const quantity = report.companies.reduce(
      (sum, company) => sum + company.items.reduce((lineSum, line) => lineSum + Number(line.quantity || 0), 0),
      0,
    );
    return { companies, lines, quantity };
  }, [report]);

  const availablePaymentCargas = useMemo(() => {
    return cargas
      .filter((carga) => !selectedPaymentCargaIds.includes(carga.id))
      .map((carga) => ({
        value: String(carga.id),
        label: `Carga #${carga.id} - ${formatDateBr(carga.load_date)} (${carga.status})`,
      }));
  }, [cargas, selectedPaymentCargaIds]);

  const unloadingCargaOptions = useMemo(() => {
    return cargas.map((carga) => ({
      value: String(carga.id),
      label: `Carga #${carga.id} - ${formatDateBr(carga.load_date)} (${carga.status})`,
    }));
  }, [cargas]);

  const previewUnloadingGroups = selectedHistoryDetail ? parseUnloadingHistoryGroups(selectedHistoryDetail.result_data) : [];
  const previewPaymentGroups = selectedHistoryDetail ? parsePaymentHistoryGroups(selectedHistoryDetail.result_data) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6 print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Relatórios</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="descarregamento" className="space-y-4">
        <TabsList className="print:hidden">
          <TabsTrigger value="descarregamento">Descarregamento</TabsTrigger>
          <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="descarregamento" className="space-y-4">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Filtro da Carga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Carga</label>
                <SearchCombobox
                  value={selectedCargaId}
                  onChange={setSelectedCargaId}
                  options={unloadingCargaOptions}
                  placeholder={cargas.length === 0 ? 'Nenhuma carga cadastrada' : 'Selecione a carga'}
                />
              </div>
              <div>
                <Button type="button" onClick={generateUnloadingReport} disabled={isLoading || !selectedCargaId}>
                  {isLoading ? 'Gerando...' : 'Gerar relatório'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 print:hidden sm:grid-cols-3">
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Firmas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportSummary.companies}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Linhas de descarga</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportSummary.lines}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quantidade total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportSummary.quantity.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="print:border-0 print:shadow-none">
            <CardHeader>
              <CardTitle>
                {report
                  ? `Relatório da Carga #${report.carga_id} - ${formatDateBr(report.load_date)}`
                  : 'Relatório de descarregamento'}
              </CardTitle>
              {report && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Data de formação da carga: {formatDateTimeBr(report.created_at) || 'Não informada'}</p>
                  <p>Placa do caminhão: {report.vehicle_plate || 'Não informada'}</p>
                  <p>Motorista: {report.driver_name || 'Não informado'}</p>
                </div>
              )}
            </CardHeader>
            <CardContent className="print-report space-y-4">
              {isLoading ? (
                <p className="py-8 text-center text-muted-foreground">Carregando...</p>
              ) : !report ? (
                <p className="py-8 text-center text-muted-foreground">Selecione uma carga para visualizar.</p>
              ) : report.companies.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum frete vinculado a esta carga.</p>
              ) : (
                <div className="space-y-2">
                  {report.companies.map((company) => (
                    <div key={company.company_id} className="space-y-2 rounded-lg border p-3">
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_6fr]">
                        <span className="text-sm font-semibold text-muted-foreground">FIRMA</span>
                        <span className="text-sm font-semibold">{company.company_name}</span>
                      </div>
                      <div className="hidden grid-cols-[2fr_2fr_2fr_1fr] gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground sm:grid">
                        <span>Produtor</span>
                        <span>Produto</span>
                        <span>Embalagem</span>
                        <span className="text-right">Quantidade</span>
                      </div>
                      {company.items.map((item, idx) => (
                        <div
                          key={`${company.company_id}-${item.producer_id}-${item.product_id}-${item.package_type_id ?? 'none'}-${idx}`}
                          className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr]"
                        >
                          <span className="text-sm">{item.producer_name}</span>
                          <span className="text-sm">{item.product_name}</span>
                          <span className="text-sm">{item.package_type_name}</span>
                          <span className="text-sm font-semibold sm:text-right">{Number(item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr]">
                        <span className="text-sm font-semibold sm:col-span-3">Subtotal</span>
                        <span className="text-sm font-semibold sm:text-right">
                          {company.items.reduce((sum, item) => sum + Number(item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamento">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Relatório de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Selecione as cargas</p>
                {cargas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma carga cadastrada.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <SearchCombobox
                        value={paymentCargaToAdd}
                        onChange={setPaymentCargaToAdd}
                        options={availablePaymentCargas}
                        placeholder="Selecione uma carga"
                      />
                      <Button type="button" variant="outline" onClick={addPaymentCarga} disabled={!paymentCargaToAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>

                    {selectedPaymentCargaIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma carga selecionada.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPaymentCargaIds.map((id) => {
                          const carga = cargas.find((item) => item.id === id);
                          if (!carga) {
                            return null;
                          }
                          return (
                            <div key={id} className="flex items-center justify-between rounded-md border px-3 py-2">
                              <span className="text-sm">
                                Carga #{carga.id} - {formatDateBr(carga.load_date)} ({carga.status})
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removePaymentCarga(id)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Button type="button" onClick={loadPaymentReport} disabled={isLoading}>
                  {isLoading ? 'Gerando...' : 'Gerar relatório de pagamento'}
                </Button>
              </div>

              {!paymentReport ? (
                <p className="text-sm text-muted-foreground">Selecione as cargas e gere o relatório.</p>
              ) : paymentReport.companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum frete encontrado para as cargas selecionadas.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Datas das cargas: {formatCargaDatesText(paymentReport.cargas)}
                  </p>
                  {paymentReport.companies.map((company) => (
                    <div key={company.company_id} className="space-y-2 rounded-lg border p-3">
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_6fr]">
                        <span className="text-sm font-semibold text-muted-foreground">FIRMA</span>
                        <span className="text-sm font-semibold">{company.company_name}</span>
                      </div>
                      <div className="hidden grid-cols-[2fr_2fr_2fr_1fr_1fr] gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground sm:grid">
                        <span>Produtor</span>
                        <span>Produto</span>
                        <span>Embalagem</span>
                        <span className="text-right">Quantidade</span>
                        <span className="text-right">Valor</span>
                      </div>
                      {company.items.map((item, idx) => (
                        <div
                          key={`${company.company_id}-${item.producer_id}-${item.product_id}-${item.package_type_id ?? 'none'}-${idx}`}
                          className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr_1fr]"
                        >
                          <span className="text-sm">{item.producer_name}</span>
                          <span className="text-sm">{item.product_name}</span>
                          <span className="text-sm">{item.package_type_name}</span>
                          <span className="text-sm sm:text-right">{Number(item.quantity).toFixed(2)}</span>
                          <span className="text-sm font-semibold sm:text-right">{Number(item.total_amount).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr_1fr]">
                        <span className="text-sm font-semibold sm:col-span-3">Subtotal</span>
                        <span className="text-sm font-semibold sm:text-right">
                          {company.items.reduce((sum, item) => sum + Number(item.quantity), 0).toFixed(2)}
                        </span>
                        <span />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios Gerados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isHistoryLoading ? (
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum relatório registrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Parâmetros</TableHead>
                      <TableHead>Gerado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold">{formatHistoryType(item.report_type)}</p>
                            <p className="text-xs text-muted-foreground">#{item.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatHistoryParams(item)}</TableCell>
                        <TableCell className="text-sm">{formatDateTimeBr(item.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openHistoryPreview(item.id)}
                              disabled={historyActionId === item.id}
                              title="Visualizar"
                              aria-label="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadHistoryPdf(item.id)}
                              disabled={historyActionId === item.id}
                              title="PDF"
                              aria-label="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteHistoryReport(item.id)}
                              disabled={historyActionId === item.id}
                              className="text-destructive hover:bg-destructive/10"
                              title="Excluir"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedHistoryDetail
                ? `${formatHistoryType(selectedHistoryDetail.report_type)} - ${formatHistoryParams(selectedHistoryDetail)}`
                : 'Visualização do Relatório'}
            </DialogTitle>
          </DialogHeader>

          {!selectedHistoryDetail ? (
            <p className="text-sm text-muted-foreground">Nenhum relatório selecionado.</p>
          ) : selectedHistoryDetail.report_type === 'unloading' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Data de formação da carga: {formatDateTimeBr(String((selectedHistoryDetail.result_data as any)?.created_at ?? '')) || 'Não informada'}
              </p>
              <p className="text-sm text-muted-foreground">
                Placa: {String((selectedHistoryDetail.result_data as any)?.vehicle_plate ?? '') || 'Não informada'}
              </p>
              <p className="text-sm text-muted-foreground">
                Motorista: {String((selectedHistoryDetail.result_data as any)?.driver_name ?? '') || 'Não informado'}
              </p>
              {previewUnloadingGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
              ) : (
                <div className="space-y-2">
                  {previewUnloadingGroups.map((group, groupIdx) => (
                    <div key={`${group.company_name}-${groupIdx}`} className="space-y-2 rounded-lg border p-3">
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_6fr]">
                        <span className="text-sm font-semibold text-muted-foreground">FIRMA</span>
                        <span className="text-sm font-semibold">{group.company_name}</span>
                      </div>
                      <div className="hidden grid-cols-[2fr_2fr_2fr_1fr] gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground sm:grid">
                        <span>Produtor</span>
                        <span>Produto</span>
                        <span>Embalagem</span>
                        <span className="text-right">Quantidade</span>
                      </div>
                      {group.items.map((row, idx) => (
                        <div
                          key={`${group.company_name}-${row.producer_name}-${row.product_name}-${row.package_type_name}-${idx}`}
                          className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr]"
                        >
                          <span className="text-sm">{row.producer_name}</span>
                          <span className="text-sm">{row.product_name}</span>
                          <span className="text-sm">{row.package_type_name}</span>
                          <span className="text-sm font-semibold sm:text-right">{Number(row.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr]">
                        <span className="text-sm font-semibold sm:col-span-3">Subtotal</span>
                        <span className="text-sm font-semibold sm:text-right">
                          {group.items.reduce((sum, row) => sum + Number(row.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Datas das cargas: {formatCargaDatesText(((selectedHistoryDetail.result_data as any)?.cargas ?? []) as Array<{ carga_id: number; load_date: string }>)}
              </p>
              {previewPaymentGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
              ) : (
                <div className="space-y-2">
                  {previewPaymentGroups.map((group, groupIdx) => (
                    <div key={`${group.company_name}-${groupIdx}`} className="space-y-2 rounded-lg border p-3">
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_6fr]">
                        <span className="text-sm font-semibold text-muted-foreground">FIRMA</span>
                        <span className="text-sm font-semibold">{group.company_name}</span>
                      </div>
                      <div className="hidden grid-cols-[2fr_2fr_2fr_1fr_1fr] gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground sm:grid">
                        <span>Produtor</span>
                        <span>Produto</span>
                        <span>Embalagem</span>
                        <span className="text-right">Quantidade</span>
                        <span className="text-right">Valor</span>
                      </div>
                      {group.items.map((row, idx) => (
                        <div
                          key={`${group.company_name}-${row.producer_name}-${row.product_name}-${row.package_type_name}-${idx}`}
                          className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr_1fr]"
                        >
                          <span className="text-sm">{row.producer_name || '-'}</span>
                          <span className="text-sm">{row.product_name || '-'}</span>
                          <span className="text-sm">{row.package_type_name || '-'}</span>
                          <span className="text-sm sm:text-right">{Number(row.quantity).toFixed(2)}</span>
                          <span className="text-sm font-semibold sm:text-right">{Number(row.total_amount).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[2fr_2fr_2fr_1fr_1fr]">
                        <span className="text-sm font-semibold sm:col-span-3">Subtotal</span>
                        <span className="text-sm font-semibold sm:text-right">
                          {group.items.reduce((sum, row) => sum + Number(row.quantity), 0).toFixed(2)}
                        </span>
                        <span />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
