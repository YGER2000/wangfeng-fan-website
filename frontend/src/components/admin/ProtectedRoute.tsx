import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, UserRole, hasPermission as canAccess } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { currentRole, isLoading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const isLight = theme === 'white';

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex h-full min-h-[40vh] w-full items-center justify-center gap-3 text-sm font-medium tracking-wide',
          isLight ? 'text-wangfeng-purple' : 'text-white'
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>正在校验权限...</span>
      </div>
    );
  }

  const hasAccess = allowedRoles.some((role) => canAccess(currentRole, role));

  if (!hasAccess) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
