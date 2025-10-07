import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { useState } from "react";
import type { User } from "@shared/schema";
import {
  Home,
  Brain,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface FloatingNavProps {
  user: User;
  currentPage: string;
}

export default function FloatingNav({ user, currentPage }: FloatingNavProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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

  const getUserInitials = (user: User) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return first + last || user.email?.[0] || 'U';
  };

  const industryName = user.industry === 'medical' ? 'Medical Intelligence' :
                       user.industry === 'finance' ? 'Finance Intelligence' :
                       user.industry === 'legal' ? 'Legal Intelligence' :
                       user.industry === 'logistics' ? 'Logistics Intelligence' :
                       user.industry === 'real_estate' ? 'Real Estate Intelligence' :
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
            user.industry === 'real_estate' ? '/real-estate' :
            '/dashboard',
      gradient: 'from-purple-500 to-pink-500',
      pulse: true
    },
    { 
      icon: Clock, 
      label: 'Recent Documents', 
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
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button - Bottom Right */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 active:scale-95"
          data-testid="button-open-nav"
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>

      {/* Navigation Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="left" 
          className="w-full sm:w-80 p-0 border-r-2 border-purple-200 dark:border-purple-800"
        >
          {/* Header with Profile */}
          <SheetHeader className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-750">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-purple-500/50">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-lg">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-gray-900 dark:text-gray-100">
                  {user.firstName} {user.lastName}
                </SheetTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role || user.industry || 'Professional'}
                </p>
              </div>
            </motion.div>
          </SheetHeader>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2 flex-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.path;
              
              return (
                <motion.button
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive ? 
                      `bg-gradient-to-r ${item.gradient} text-white shadow-lg` : 
                      'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                    group relative overflow-hidden
                  `}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`
                    p-2 rounded-lg
                    ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                  {item.pulse && !isActive && (
                    <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                  )}
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => {
                setLocation('/settings');
                setIsOpen(false);
              }}
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick Upload FAB - Bottom Left */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50"
      >
        <Button
          onClick={() => {
            const uploadZone = document.getElementById('upload-zone');
            if (uploadZone) {
              uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
              uploadZone.classList.add('ring-4', 'ring-purple-500', 'ring-opacity-75');
              setTimeout(() => {
                uploadZone.classList.remove('ring-4', 'ring-purple-500', 'ring-opacity-75');
              }, 2000);
            }
          }}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-blue-500/50 transition-all duration-300 active:scale-95"
          data-testid="button-upload-floating"
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </Button>
      </motion.div>
    </>
  );
}
