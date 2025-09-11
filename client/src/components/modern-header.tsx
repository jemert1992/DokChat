import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getIndustryConfig } from "@/lib/industry-config";
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
            {/* User Avatar Group */}
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-sm">
                <span className="text-white text-xs font-semibold">
                  {getUserInitials(user)}
                </span>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-sm">
                <i className="fas fa-robot text-white text-xs"></i>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-sm">
                <i className="fas fa-chart-line text-white text-xs"></i>
              </div>
              <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <i className="fas fa-plus text-gray-400 dark:text-gray-500 text-xs"></i>
              </button>
            </div>

            {/* Create New Button */}
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-medium shadow-sm"
              onClick={onCreateNew}
              data-testid="button-create-new"
            >
              <i className="fas fa-plus mr-2"></i>
              Create New
            </Button>

            {/* Settings Menu */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 h-9 w-9 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setLocation('/industry-selection')}
              data-testid="button-settings-menu"
            >
              <i className="fas fa-ellipsis-v"></i>
            </Button>
          </div>
        </div>

        {/* Main Title Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Document Intelligence Dashboard
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