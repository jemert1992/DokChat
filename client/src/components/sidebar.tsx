import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getIndustryConfig } from "@/lib/industry-config";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  currentPage: string;
}

export default function Sidebar({ user, currentPage }: SidebarProps) {
  const [, setLocation] = useLocation();
  const industryConfig = getIndustryConfig(user.industry || 'general');

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleNavClick = (item: any) => {
    switch (item.action) {
      case 'navigate':
        if (item.path) setLocation(item.path);
        break;
      case 'focus-upload':
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
          uploadZone.scrollIntoView({ behavior: 'smooth' });
          uploadZone.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
          setTimeout(() => {
            uploadZone.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
          }, 2000);
        }
        break;
      case 'scroll-to-activity':
        const activitySection = document.querySelector('[data-testid="recent-activity"]');
        if (activitySection) {
          activitySection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      default:
        if (item.path) setLocation(item.path);
    }
  };

  const navItems = [
    { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', path: '/dashboard', action: 'navigate' },
    { id: 'upload', icon: 'fas fa-upload', label: 'Upload Documents', path: '/dashboard', action: 'focus-upload' },
    { id: 'library', icon: 'fas fa-folder-open', label: industryConfig.documentLibraryLabel, path: '/dashboard', action: 'scroll-to-activity' },
    { id: 'analytics', icon: 'fas fa-chart-bar', label: 'Analytics', path: '/dashboard', action: 'navigate' },
    { id: 'settings', icon: 'fas fa-cog', label: 'Settings', path: '/industry-selection', action: 'navigate' },
  ];

  const getUserInitials = (user: User) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return first + last || user.email?.[0] || 'U';
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'User';
  };

  return (
    <div className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <i className="fas fa-file-alt text-primary-foreground text-sm"></i>
          </div>
          <span className="text-xl font-bold text-foreground">DOKTECH 3.0</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                currentPage === item.id
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <i className={`${item.icon} w-5`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="mt-auto p-6 border-t border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
              {getUserInitials(user)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-name">
              {getUserDisplayName(user)}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-industry">
              {industryConfig.userTitle}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
      </div>
    </div>
  );
}
