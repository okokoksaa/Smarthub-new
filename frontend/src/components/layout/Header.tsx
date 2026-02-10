import { Bell, Search, User, ChevronDown, LogOut, Settings, Shield, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, formatNotificationTime, getNotificationTypeColor } from '@/hooks/useNotifications';

// Role display names
const roleDisplayNames: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  ministry_official: 'Ministry Official',
  auditor: 'Auditor',
  plgo: 'PLGO',
  tac_chair: 'TAC Chair',
  tac_member: 'TAC Member',
  cdfc_chair: 'CDFC Chair',
  cdfc_member: 'CDFC Member',
  finance_officer: 'Finance Officer',
  wdc_member: 'WDC Member',
  mp: 'Member of Parliament',
  contractor: 'Contractor',
  citizen: 'Citizen',
};

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications(10);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    return email.substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    const metadata = user?.user_metadata;
    if (metadata?.first_name && metadata?.last_name) {
      return `${metadata.first_name} ${metadata.last_name}`;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getPrimaryRole = (): string => {
    if (rolesLoading) return 'Loading...';
    if (roles.length === 0) return 'No Role Assigned';
    // Return the first (primary) role's display name
    return roleDisplayNames[roles[0]] || roles[0];
  };

  const getRoleBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (roles.includes('super_admin')) return 'destructive';
    if (roles.includes('ministry_official') || roles.includes('auditor')) return 'default';
    if (roles.includes('plgo') || roles.includes('cdfc_chair') || roles.includes('tac_chair')) return 'secondary';
    return 'outline';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects, payments, constituencies..."
          className="pl-10"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Current Tenant Context */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Viewing:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                National Scope
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch Scope</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>National (All)</DropdownMenuItem>
              <DropdownMenuItem>Lusaka Province</DropdownMenuItem>
              <DropdownMenuItem>Copperbelt Province</DropdownMenuItem>
              <DropdownMenuItem>Central Province</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                  disabled={isMarkingAllRead}
                >
                  {isMarkingAllRead ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </>
                  )}
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 py-3 cursor-pointer ${
                    !notification.is_read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.action_url) {
                      navigate(notification.action_url);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className={`font-medium ${getNotificationTypeColor(notification.type)}`}>
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary ml-auto" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-sm text-primary"
                  onClick={() => navigate('/notifications')}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={getRoleBadgeVariant()} className="h-4 px-1.5 text-[10px] font-medium">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />
                    {getPrimaryRole()}
                  </Badge>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Your Roles</p>
                  <div className="flex flex-wrap gap-1">
                    {roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-[10px]">
                        {roleDisplayNames[role]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
