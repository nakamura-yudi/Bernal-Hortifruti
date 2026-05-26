import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((role: any) => String(role?.name ?? '').toUpperCase())
    : [];
  const isAdmin = roleNames.includes('ADMIN');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
