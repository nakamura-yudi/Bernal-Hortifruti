import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function Perfil() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((role: any) => String(role?.name ?? '')).join(', ')
    : '';

  const directPermissions = Array.isArray(user?.permissions)
    ? user.permissions
        .map((permission: any) => String(permission?.name ?? ''))
        .filter(Boolean)
        .sort()
    : [];

  const inheritedPermissions = Array.isArray(user?.roles)
    ? Array.from(
        new Set(
          user.roles.flatMap((role: any) =>
            Array.isArray(role?.permissions)
              ? role.permissions
                  .map((permission: any) => String(permission?.name ?? ''))
                  .filter(Boolean)
              : [],
          ),
        ),
      ).sort()
    : [];

  const effectivePermissions = Array.from(new Set([...inheritedPermissions, ...directPermissions])).sort();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos da senha');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação de senha não confere');
      return;
    }

    setIsSaving(true);
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      await logout();
      toast.success('Senha alterada. Faça login novamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.response?.data?.detail || 'Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Perfil
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Minha conta</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Visualize suas informações e altere sua senha.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Nome:</strong> {user?.name ?? '-'}</p>
          <p><strong>Email:</strong> {user?.email ?? '-'}</p>
          <p><strong>Perfis:</strong> {roleNames || 'Sem perfil'}</p>
          <p><strong>Status:</strong> {user?.is_active ? 'Ativo' : 'Inativo'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RBAC da minha conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-medium">Papéis</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(user?.roles) && user.roles.length > 0 ? (
                user.roles.map((role: any) => (
                  <Badge key={role.id ?? role.name} variant="secondary">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhum papel vinculado.</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Permissões herdadas dos papéis</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {inheritedPermissions.length > 0 ? (
                inheritedPermissions.map((permissionName) => (
                  <Badge key={permissionName} variant="outline">
                    {permissionName}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma permissão herdada.</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Permissões diretas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {directPermissions.length > 0 ? (
                directPermissions.map((permissionName) => (
                  <Badge key={permissionName}>
                    {permissionName}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma permissão direta.</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Permissões efetivas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {effectivePermissions.length > 0 ? (
                effectivePermissions.map((permissionName) => (
                  <Badge key={permissionName} variant="secondary">
                    {permissionName}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma permissão efetiva.</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
