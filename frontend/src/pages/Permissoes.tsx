import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { permissionsAPI, rolesAPI } from '@/lib/api';

export default function Permissoes() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([rolesAPI.list(), permissionsAPI.list()]);
      setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.items ?? []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : permissionsData?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar RBAC:', error);
      setRoles([]);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc: Record<string, string[]>, permission: any) => {
      const permissionName = String(permission?.name ?? '');
      if (!permissionName) {
        return acc;
      }
      const groupName = permissionName.includes(':') ? permissionName.split(':', 1)[0] : 'geral';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(permissionName);
      return acc;
    }, {});
  }, [permissions]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Administração
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Permissões e RBAC</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Visualize papéis, permissões do sistema e a estrutura de acesso baseada em função.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Papéis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Permissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Grupos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedPermissions).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Papéis do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum papel encontrado.</p>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{role.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                    role.permissions.map((permission: any) => (
                      <Badge key={permission.id ?? permission.name} variant="secondary">
                        {permission.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem permissões vinculadas.</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma permissão cadastrada.</p>
          ) : (
            Object.entries(groupedPermissions)
              .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
              .map(([groupName, permissionNames]) => (
                <div key={groupName} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide">{groupName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {permissionNames
                      .slice()
                      .sort((a, b) => a.localeCompare(b))
                      .map((permissionName) => (
                        <Badge key={permissionName} variant="outline">
                          {permissionName}
                        </Badge>
                      ))}
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
