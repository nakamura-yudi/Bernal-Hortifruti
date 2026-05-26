import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { permissionsAPI, rolesAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function Perfis() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [selectedPermissionNames, setSelectedPermissionNames] = useState<string[]>([]);

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
      console.error('Erro ao carregar perfis:', error);
      toast.error('Erro ao carregar perfis e permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc: Record<string, any[]>, permission: any) => {
      const permissionName = String(permission?.name ?? '');
      const groupName = permissionName.includes(':') ? permissionName.split(':', 1)[0] : 'geral';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  const openCreate = () => {
    setSelectedRole(null);
    setFormName('');
    setSelectedPermissionNames([]);
    setOpenForm(true);
  };

  const openEdit = (role: any) => {
    setSelectedRole(role);
    setFormName(String(role?.name ?? ''));
    setSelectedPermissionNames(
      Array.isArray(role?.permissions) ? role.permissions.map((permission: any) => String(permission?.name ?? '')) : [],
    );
    setOpenForm(true);
  };

  const handleTogglePermission = (permissionName: string, checked: boolean) => {
    setSelectedPermissionNames((current) => {
      if (checked) {
        return current.includes(permissionName) ? current : [...current, permissionName];
      }
      return current.filter((name) => name !== permissionName);
    });
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Informe o nome do perfil');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedRole) {
        await rolesAPI.update(selectedRole.id, {
          name: formName,
          permission_names: selectedPermissionNames,
        });
        toast.success('Perfil atualizado com sucesso');
      } else {
        await rolesAPI.create({
          name: formName,
          permission_names: selectedPermissionNames,
        });
        toast.success('Perfil criado com sucesso');
      }
      setOpenForm(false);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role: any) => {
    const confirmed = window.confirm(`Excluir o perfil ${role.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await rolesAPI.delete(role.id);
      toast.success('Perfil excluído com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao excluir perfil:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir perfil');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Administração
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Perfis de acesso</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Crie perfis e vincule permissões para o RBAC do sistema.
            </p>
          </div>
          <Dialog open={openForm} onOpenChange={setOpenForm}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Novo Perfil</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedRole ? 'Editar perfil' : 'Novo perfil'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do perfil"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                />
                <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                  {Object.entries(groupedPermissions)
                    .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                    .map(([groupName, groupPermissions]) => (
                      <div key={groupName} className="rounded-lg border p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{groupName}</h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {groupPermissions.map((permission: any) => {
                            const permissionName = String(permission?.name ?? '');
                            return (
                              <label
                                key={permission.id}
                                className="flex items-start gap-3 rounded-md border bg-background px-3 py-3"
                              >
                                <Checkbox
                                  checked={selectedPermissionNames.includes(permissionName)}
                                  onCheckedChange={(checked) => handleTogglePermission(permissionName, checked === true)}
                                />
                                <span className="text-sm font-medium leading-none">{permissionName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenForm(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfis cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum perfil cadastrado.</p>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{role.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Array.isArray(role.permissions) ? role.permissions.length : 0} permissões vinculadas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(role)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(role)}>
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                    role.permissions.map((permission: any) => (
                      <span
                        key={permission.id ?? permission.name}
                        className="rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground"
                      >
                        {permission.name}
                      </span>
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
    </div>
  );
}
