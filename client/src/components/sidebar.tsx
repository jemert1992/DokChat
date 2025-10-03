import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useState } from "react";
import type { User } from "@shared/schema";
import {
  Home,
  FileText,
  Brain,
  Upload,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  user: User;
  currentPage: string;
  onNavigate?: (view: string) => void;
}

export default function Sidebar({ user, currentPage, onNavigate }: SidebarProps) {
  const [, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (user: User) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return first + last || user.email?.[0] || 'U';
  };

  const industryName = user.industry === 'medical' ? 'Medical Intelligence' :
                       user.industry === 'finance' ? 'Finance Intelligence' :
                       user.industry === 'legal' ? 'Legal Intelligence' :
                       user.industry === 'logistics' ? 'Logistics Intelligence' :
                       'Business Intelligence';

  const navItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      path: '/dashboard',
      gradient: 'from-blue-500 to-indigo-500'
    },
    { 
      icon: Brain, 
      label: industryName, 
      path: user.industry === 'medical' ? '/medical' :
            user.industry === 'finance' ? '/finance' :
            user.industry === 'legal' ? '/legal' :
            user.industry === 'logistics' ? '/logistics' :
            '/dashboard',
      gradient: 'from-purple-500 to-pink-500',
      pulse: true
    },
    { 
      icon: Clock, 
      label: 'Recent', 
      path: '#recent',
      action: 'scroll-to-recent',
      gradient: 'from-green-500 to-teal-500'
    }
  ];

  const handleNavClick = (item: any) => {
    if (item.action === 'scroll-to-recent') {
      const recentSection = document.querySelector('[data-testid="recent-documents"]');
      if (recentSection) {
        recentSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.path) {
      setLocation(item.path);
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        fixed left-0 top-0 h-screen
        ${isCollapsed ? 'w-20' : 'w-72'}
        bg-gradient-to-b from-white via-gray-50 to-gray-100
        dark:from-gray-900 dark:via-gray-850 dark:to-gray-800
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50
        z-40
        lg:translate-x-0
        ${isCollapsed ? '' : 'max-lg:w-full max-lg:translate-x-[-100%]'}
      `}
    >
      {/* Mini Profile Card */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <motion.div 
          className="flex items-center gap-4"
          whileHover={{ scale: 1.02 }}
        >
          <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-purple-500/20">
            <AvatarImage src={user.profileImage} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role || user.industry || 'Professional'}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto hover:bg-gray-200 dark:hover:bg-gray-700"
            data-testid="button-toggle-sidebar"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </Button>
        </motion.div>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          
          return (
            <motion.button
              key={item.label}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavClick(item)}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive ? 
                  `bg-gradient-to-r ${item.gradient} text-white shadow-lg` : 
                  'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
                ${item.pulse && !isActive ? 'animate-pulse' : ''}
                group relative overflow-hidden
              `}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className={`
                p-2 rounded-lg
                ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}
              `}>
                <Icon className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.pulse && !isActive && (
                    <Sparkles className="h-4 w-4 ml-auto text-purple-500 animate-pulse" />
                  )}
                </>
              )}
              
              {/* Hover effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                animate={isActive ? { translateX: '200%' } : {}}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
              />
            </motion.button>
          );
        })}
      </nav>

      {/* Floating Upload Button */}
      <motion.div
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => {
            const uploadZone = document.getElementById('upload-zone');
            if (uploadZone) {
              uploadZone.scrollIntoView({ behavior: 'smooth' });
              uploadZone.classList.add('ring-4', 'ring-purple-500', 'ring-opacity-75');
              setTimeout(() => {
                uploadZone.classList.remove('ring-4', 'ring-purple-500', 'ring-opacity-75');
              }, 2000);
            }
          }}
          className={`
            ${isCollapsed ? 'h-12 w-12' : 'h-14 px-6'}
            bg-gradient-to-r from-purple-600 to-pink-600
            hover:from-purple-700 hover:to-pink-700
            text-white shadow-xl rounded-full
            flex items-center justify-center gap-2
            transform transition-all duration-300
          `}
          data-testid="button-upload-floating"
        >
          <Upload className="h-5 w-5" />
          {!isCollapsed && <span className="font-semibold">Upload</span>}
        </Button>
      </motion.div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/settings')}
            className="hover:bg-gray-200 dark:hover:bg-gray-700"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}