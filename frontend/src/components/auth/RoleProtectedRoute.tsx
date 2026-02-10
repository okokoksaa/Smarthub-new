import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/'
}: RoleProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, hasAnyRole } = useUserRoles();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);

  const isLoading = authLoading || rolesLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (roles.length > 0 && !hasAnyRole(allowedRoles) && !hasShownToast.current) {
        hasShownToast.current = true;
        
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to access this page. Redirecting to dashboard...",
        });

        setTimeout(() => {
          navigate(redirectTo);
        }, 2000);
      }
    }
  }, [user, roles, isLoading, allowedRoles, hasAnyRole, navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (roles.length > 0 && !hasAnyRole(allowedRoles)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
