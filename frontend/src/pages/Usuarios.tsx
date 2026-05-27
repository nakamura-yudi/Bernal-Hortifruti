import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usersAPI, rolesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export default function Usuarios() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [openReset, setOpenReset] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role_name: 'OPERADOR',
  });

  useEffect(() => {
    void loadUsers();
    void loadRoles();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersAPI.list();
      setUsers(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolesAPI.list();
      setRoles(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      setRoles([]);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.role_name) {
      toast.error('Preencha nome, email, senha e perfil');
      return;
    }

    setIsSaving(true);
    try {
      await usersAPI.create({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        is_active: true,
        role_names: [createForm.role_name],
      });
      toast.success('Usuário criado com sucesso');
      setCreateForm({ name: '', email: '', password: '', role_name: 'OPERADOR' });
      setOpenCreate(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      await usersAPI.update(user.id, { is_active: !Boolean(user.is_active) });
      toast.success(user.is_active ? 'Usuário desativado com sucesso' : 'Usuário ativado com sucesso');
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário');
    }
  };

  const openRoleDialog = (user: any) => {
    const roleName =
      Array.isArray(user.roles) && user.roles.length > 0
        ? String(user.roles[0]?.name ?? '')
        : '';
    setSelectedUser(user);
    setSelectedRoleName(roleName);
    setOpenRole(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) {
      return;
    }
    if (!selectedRoleName) {
      toast.error('Selecione um perfil');
      return;
    }

    setIsSavingRole(true);
    try {
      await usersAPI.update(selectedUser.id, { role_names: [selectedRoleName] });
      toast.success('Perfil atualizado com sucesso');
      setOpenRole(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setIsSavingRole(false);
    }
  };

  const openResetDialog = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setOpenReset(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsResetting(true);
    try {
      await usersAPI.resetPassword(selectedUser.id, newPassword);
      toast.success(`Senha de ${selectedUser.name ?? selectedUser.email} redefinida com sucesso`);
      setOpenReset(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.response?.data?.detail || 'Erro ao redefinir senha');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter((user) => {
      const roles = Array.isArray(user.roles) ? user.roles.map((role: any) => role?.name).join(' ') : '';
      const content = `${user.name ?? ''} ${user.email ?? ''} ${roles}`.toLowerCase();
      return content.includes(term);
    });
  }, [search, users]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Usuários
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestão de usuários</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Acesso restrito para superusuário (ADMIN).
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Nome"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <Input
                  placeholder="Senha"
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                />
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.role_name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, role_name: event.target.value }))}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Usuários cadastrados</CardTitle>
          <Input
            placeholder="Buscar por nome, email ou perfil..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog
            open={openReset}
            onOpenChange={(open) => {
              setOpenReset(open);
              if (!open) {
                setSelectedUser(null);
                setNewPassword('');
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Redefinir senha
                  {selectedUser ? `: ${selectedUser.name ?? selectedUser.email}` : ''}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O usuário será desconectado imediatamente e precisará entrar com a nova senha.
                </p>
                <Input
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleResetPassword(); }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenReset(false)} disabled={isResetting}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleResetPassword} disabled={isResetting}>
                    {isResetting ? 'Redefinindo...' : 'Redefinir senha'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={openRole}
            onOpenChange={(open) => {
              setOpenRole(open);
              if (!open) {
                setSelectedUser(null);
                setSelectedRoleName('');
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Perfil do usuário
                  {selectedUser ? `: ${selectedUser.name ?? selectedUser.email}` : ''}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedRoleName}
                  onChange={(event) => setSelectedRoleName(event.target.value)}
                >
                  <option value="">Selecione um perfil</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenRole(false)} disabled={isSavingRole}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveRole} disabled={isSavingRole}>
                    {isSavingRole ? 'Salvando...' : 'Salvar perfil'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_320px] gap-3 rounded-md bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:grid">
                <span>Nome</span>
                <span>Email</span>
                <span>Perfil</span>
                <span>Status</span>
                <span className="text-right">Ações</span>
              </div>
              {filteredUsers.map((user) => {
                const roleName =
                  Array.isArray(user.roles) && user.roles.length > 0
                    ? user.roles.map((role: any) => role?.name).join(', ')
                    : 'Sem perfil';
                return (
                  <div
                    key={user.id}
                    className="grid gap-4 rounded-xl border bg-background/80 px-4 py-4 shadow-sm sm:grid-cols-[2fr_2fr_1fr_1fr_320px]"
                  >
                    <div className="text-sm font-medium">{user.name ?? 'Sem nome'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-sm text-muted-foreground">{roleName}</div>
                    <div className="text-sm text-muted-foreground">{user.is_active ? 'Ativo' : 'Inativo'}</div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRoleDialog(user)}
                      >
                        Perfil
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openResetDialog(user)}
                      >
                        Resetar senha
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(user)}
                        disabled={currentUser?.id === user.id}
                      >
                        {user.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
