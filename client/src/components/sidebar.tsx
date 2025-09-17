import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { getIndustryConfig } from "@/lib/industry-config";
import { useState } from "react";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  currentPage: string;
  onNavigate?: (view: string) => void;
}

export default function Sidebar({ user, currentPage, onNavigate }: SidebarProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const industryConfig = getIndustryConfig(user.industry || 'general');

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleNavClick = (item: any) => {
    switch (item.action) {
      case 'navigate':
        if (item.view && onNavigate) {
          onNavigate(item.view);
        } else if (item.path) {
          setLocation(item.path);
        }
        break;
      case 'focus-upload':
        // Switch to documents view and focus upload
        if (onNavigate) onNavigate('documents');
        setTimeout(() => {
          const uploadZone = document.getElementById('upload-zone');
          if (uploadZone) {
            uploadZone.scrollIntoView({ behavior: 'smooth' });
            uploadZone.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
            setTimeout(() => {
              uploadZone.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
            }, 2000);
          }
        }, 100);
        break;
      case 'scroll-to-activity':
        // Switch to documents view and scroll to activity
        if (onNavigate) onNavigate('documents');
        setTimeout(() => {
          const activitySection = document.querySelector('[data-testid="recent-activity"]');
          if (activitySection) {
            activitySection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        break;
      default:
        if (item.view && onNavigate) {
          onNavigate(item.view);
        } else if (item.path) {
          setLocation(item.path);
        }
    }
  };

  const navSections = [
    {
      label: "MAIN",
      items: [
        { id: 'capabilities', icon: 'fas fa-layer-group', label: 'Capabilities', view: 'capabilities', action: 'navigate', badge: '6' },
        { id: 'analytics', icon: 'fas fa-chart-line', label: 'Analytics', view: 'analytics', action: 'navigate', badge: null },
        { id: 'documents', icon: 'fas fa-folder-open', label: 'Documents', view: 'documents', action: 'navigate', badge: null },
      ]
    },
    {
      label: "DOCUMENT PROCESSING",
      items: [
        { id: 'upload', icon: 'fas fa-cloud-upload-alt', label: 'Upload Documents', action: 'focus-upload', badge: null },
        { id: 'library', icon: 'fas fa-folder-open', label: industryConfig.documentLibraryLabel, action: 'scroll-to-activity', badge: null },
        { id: 'intelligence', icon: 'fas fa-brain', label: 'AI Intelligence', view: 'analytics', action: 'navigate', badge: 'NEW' },
      ]
    },
    {
      label: "SETTINGS",
      items: [
        { id: 'profile', icon: 'fas fa-user-circle', label: 'Profile', view: 'profile', action: 'navigate', badge: null },
        { id: 'integrations', icon: 'fas fa-plug', label: 'Integrations', view: 'documents', action: 'navigate', badge: null },
      ]
    }
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
    <div className={`${isCollapsed ? 'w-16' : 'w-72'} bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col transition-all duration-300 relative shadow-sm`}>
      
      {/* Header with Logo and Collapse Button */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-brain text-white text-lg"></i>
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">DOKTECH</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block -mt-1">v3.0 AI Platform</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            data-testid="sidebar-collapse"
          >
            <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-gray-500 text-sm`}></i>
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="relative mb-6">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <Input
                type="text"
                placeholder="Ask anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                data-testid="search-input"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 pb-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={`${sectionIndex > 0 ? 'mt-8' : ''}`}>
            {!isCollapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                {section.label}
              </p>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-3'} rounded-xl transition-all duration-200 group relative ${
                    currentPage === item.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
                    <i className={`${item.icon} ${isCollapsed ? 'text-lg' : 'text-base'} ${currentPage === item.id ? 'text-blue-600 dark:text-blue-400' : ''}`}></i>
                    {!isCollapsed && (
                      <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.badge === 'NEW' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {item.label}
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold" data-testid="text-user-initials">
                  {getUserInitials(user)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" data-testid="text-user-name">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" data-testid="text-user-industry">
                  {industryConfig.userTitle}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="p-2 h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt text-sm"></i>
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-xs font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleNavClick({ action: 'focus-upload' })}
              >
                <i className="fas fa-plus mr-1.5"></i>
                Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-xs font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleNavClick({ view: 'profile', action: 'navigate' })}
              >
                <i className="fas fa-cog mr-1.5"></i>
                Settings
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm group relative">
              <span className="text-white text-sm font-semibold" data-testid="text-user-initials">
                {getUserInitials(user)}
              </span>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {getUserDisplayName(user)}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="p-2 h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt text-sm"></i>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}