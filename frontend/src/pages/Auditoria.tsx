import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auditAPI } from '@/lib/api';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  login:                   { label: 'Login',               variant: 'secondary' },
  logout:                  { label: 'Logout',              variant: 'outline' },
  'troca de senha':        { label: 'Troca de senha',      variant: 'outline' },
  'reset de senha':        { label: 'Reset de senha',      variant: 'outline' },
  criação:                 { label: 'Criação',             variant: 'default' },
  atualização:             { label: 'Atualização',         variant: 'secondary' },
  exclusão:                { label: 'Exclusão',            variant: 'destructive' },
  'atualização de permissões': { label: 'Perm. atualizadas', variant: 'secondary' },
};

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_LABELS[action] ?? { label: action, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const RESOURCE_TYPE_OPTIONS = [
  '', 'auth', 'usuario', 'perfil', 'permissão', 'frete', 'carga', 'produtor',
  'produto', 'embalagem', 'veículo', 'manutenção', 'firma', 'relatório', 'serviço',
];

const ACTION_OPTIONS = [
  '', 'login', 'logout', 'criação', 'atualização', 'exclusão',
  'troca de senha', 'reset de senha', 'atualização de permissões',
];

const PAGE_SIZE = 50;

// ── Renderiza o JSON de detalhes de forma legível ──────────────────────────────

function renderDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'sim' : 'não';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '(vazio)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function DetailEntry({ label, value }: { label: string; value: unknown }) {
  // Objeto de alteração: { de: X, para: Y }
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('de' in (value as object) || 'para' in (value as object))
  ) {
    const change = value as { de?: unknown; para?: unknown };
    return (
      <span>
        <span className="font-medium capitalize">{label}:</span>{' '}
        <span className="line-through text-muted-foreground">{renderDetailValue(change.de)}</span>
        {' → '}
        <span className="text-foreground">{renderDetailValue(change.para)}</span>
      </span>
    );
  }

  // Objeto aninhado (ex: "alterações": { campo: { de, para } })
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-muted-foreground">sem alterações</span>;
    }
    return (
      <span className="flex flex-col gap-0.5">
        {entries.map(([k, v]) => (
          <DetailEntry key={k} label={k} value={v} />
        ))}
      </span>
    );
  }

  return (
    <span>
      <span className="font-medium capitalize">{label}:</span> {renderDetailValue(value)}
    </span>
  );
}

function DetailsCell({ details, ip }: { details: Record<string, unknown> | null; ip: string | null }) {
  if (!details && !ip) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {details &&
        Object.entries(details).map(([key, value]) => (
          <div key={key}>
            <DetailEntry label={key} value={value} />
          </div>
        ))}
      {ip && <div className="text-muted-foreground font-mono mt-0.5">IP: {ip}</div>}
    </div>
  );
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function Auditoria() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);

  // Filtros
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (pg: number) => {
    setIsLoading(true);
    try {
      const data = await auditAPI.list({
        action: filterAction || undefined,
        resource_type: filterResource || undefined,
        user_email: filterEmail || undefined,
        date_from: filterDateFrom ? new Date(filterDateFrom).toISOString() : undefined,
        date_to: filterDateTo ? new Date(filterDateTo + 'T23:59:59').toISOString() : undefined,
        skip: pg * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, filterResource, filterEmail, filterDateFrom, filterDateTo]);

  useEffect(() => {
    setPage(0);
    void load(0);
  }, [load]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    void load(newPage);
  };

  const handleReset = () => {
    setFilterAction('');
    setFilterResource('');
    setFilterEmail('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Administração
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Auditoria</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Registro de logins, criações, alterações e exclusões do sistema.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">Todas as ações</option>
              {ACTION_OPTIONS.filter(Boolean).map((a) => (
                <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
              ))}
            </select>

            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
            >
              <option value="">Todos os recursos</option>
              {RESOURCE_TYPE_OPTIONS.filter(Boolean).map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>

            <Input
              placeholder="E-mail do usuário"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data inicial"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data final"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-12 text-center text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Nenhum registro encontrado.</p>
          ) : (
            <>
              {/* Cabeçalho da tabela */}
              <div className="hidden grid-cols-[160px_1fr_110px_100px_1fr] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Data / Hora</span>
                <span>Usuário</span>
                <span>Ação</span>
                <span>Recurso</span>
                <span>Detalhes</span>
              </div>

              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 px-4 py-3 text-sm hover:bg-muted/30 sm:grid-cols-[160px_1fr_110px_100px_1fr]"
                  >
                    {/* Data */}
                    <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </span>

                    {/* Usuário */}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.user_name ?? '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.user_email ?? '—'}</p>
                    </div>

                    {/* Ação */}
                    <div>
                      <ActionBadge action={item.action} />
                    </div>

                    {/* Recurso */}
                    <span className="text-muted-foreground capitalize">
                      {item.resource_type ?? '—'}
                    </span>

                    {/* Detalhes */}
                    <DetailsCell details={item.details} ip={item.ip_address} />
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
