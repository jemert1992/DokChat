import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getIndustryConfig } from "@/lib/industry-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@shared/schema";

interface ModernHeaderProps {
  user: User;
  onCreateNew: () => void;
}

export default function ModernHeader({ user, onCreateNew }: ModernHeaderProps) {
  const [, setLocation] = useLocation();
  const industryConfig = getIndustryConfig(user.industry || 'general');

  const getUserInitials = (user: User) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return first + last || user.email?.[0] || 'U';
  };

  const isAdmin = user.email === 'admin@emert.ai';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleSwitchIndustry = () => {
    setLocation('/industry-selection');
  };

  const breadcrumbItems = [
    { label: 'Recent', active: true },
    { label: 'Favorite', active: false },
    { label: 'Spaces', active: false }
  ];

  return (
    <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Breadcrumbs and User Actions */}
        <div className="flex items-center justify-between mb-6">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1">
            {breadcrumbItems.map((item, index) => (
              <div key={item.label} className="flex items-center">
                <button
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  data-testid={`breadcrumb-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </button>
                {index < breadcrumbItems.length - 1 && (
                  <i className="fas fa-chevron-right text-gray-300 dark:text-gray-600 text-xs mx-2"></i>
                )}
              </div>
            ))}
          </div>

          {/* User Actions and Avatars */}
          <div className="flex items-center space-x-4">
            {/* Admin Quick Switch Button (Visible for Admin Only) */}
            {isAdmin && (
              <Button
                variant="outline"
                className="border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={handleSwitchIndustry}
                data-testid="button-admin-switch-industry"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Admin: Switch Industry
              </Button>
            )}

            {/* Upload Documents Button - Primary CTA */}
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-medium shadow-sm"
              onClick={onCreateNew}
              data-testid="button-upload-documents"
            >
              <i className="fas fa-upload mr-2"></i>
              Upload Documents
            </Button>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-sm">
                    <span className="text-white text-sm font-semibold">
                      {getUserInitials(user)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
                        ADMIN
                      </Badge>
                    )}
                    <i className="fas fa-chevron-down text-gray-400 text-xs group-hover:text-gray-600 dark:group-hover:text-gray-200"></i>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {getUserInitials(user)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      {isAdmin && (
                        <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
                          Administrator
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer">
                  <i className="fas fa-user-cog mr-2 text-gray-500"></i>
                  Profile Settings
                </DropdownMenuItem>
                
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-purple-600 dark:text-purple-400">
                      Admin Tools
                    </DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="cursor-pointer text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={handleSwitchIndustry}
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      Switch Industry
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Title Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {industryConfig.dashboardTitle}
            </h1>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium">
              <i className="fas fa-circle text-xs mr-1.5"></i>
              Live
            </Badge>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {industryConfig.dashboardSubtitle} • AI-powered analysis with real-time intelligence
          </p>
        </div>

        {/* Industry Info Badge */}
        <div className="mt-4 flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
            <div className={`w-6 h-6 bg-gradient-to-br ${industryConfig.color === 'teal' ? 'from-teal-500 to-cyan-600' : industryConfig.color === 'blue-900' ? 'from-blue-600 to-indigo-700' : industryConfig.color === 'green' ? 'from-green-500 to-emerald-600' : industryConfig.color === 'orange' ? 'from-orange-500 to-red-600' : industryConfig.color === 'indigo' ? 'from-purple-500 to-pink-600' : 'from-gray-600 to-slate-700'} rounded-lg flex items-center justify-center`}>
              <i className={`${industryConfig.icon} text-white text-sm`}></i>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {industryConfig.name} Industry
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <i className="fas fa-clock mr-1"></i>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}