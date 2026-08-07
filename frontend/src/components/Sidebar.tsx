import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { 
  Menu, 
  Home, 
  Gauge, 
  GaugeCircle,
  Thermometer, 
  Zap, 
  Droplets,
  BarChart3, 
  Download, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import DOSensorLogo from './DOSensorLogo';
import { PageType } from './Dashboard';
import { useTheme } from './utils/themeContext';
import { useTranslation } from './utils/translations';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  userEmail?: string | null;
}

const getMenuItems = (t: any) => [
  { id: 'home' as PageType, label: t.dashboard, icon: Home },
  { id: 'oldDO' as PageType, label: t.oldDOConcentration, icon: Gauge },
  { id: 'newDO' as PageType, label: t.newDOConcentration, icon: GaugeCircle },
  { id: 'temperature' as PageType, label: t.temperature, icon: Thermometer },
  { id: 'pressure' as PageType, label: t.pressure, icon: Zap },
  { id: 'doSaturation' as PageType, label: t.doSaturation, icon: Droplets },
  { id: 'analytics' as PageType, label: t.analytics, icon: BarChart3 },
  { id: 'dataDownload' as PageType, label: t.dataDownload, icon: Download },
  { id: 'settings' as PageType, label: t.settings, icon: Settings },
];

export default function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse, onSignOut, userEmail }: SidebarProps) {
  const { language } = useTheme();
  const t = useTranslation(language);
  const menuItems = getMenuItems(t);
  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="bg-sidebar text-sidebar-foreground shadow-2xl border-r border-sidebar-border backdrop-blur-sm relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="p-4 border-b border-sidebar-border relative z-10">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <motion.div 
                  className="mr-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <DOSensorLogo size={32} animated={false} />
                </motion.div>
                <div>
                  <h1 className="text-lg text-sidebar-foreground">RS-LDO-N01</h1>
                  <p className="text-xs text-muted-foreground">DO Sensor Dashboard</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </motion.div>
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30 shadow-sm' 
                    : 'text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                } ${collapsed ? 'px-3' : 'px-4'}`}
                onClick={() => onPageChange(item.id)}
              >
                <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          );
        })}
      </nav>

      {/* User Information Section */}
      <div className="p-4 border-t border-sidebar-border">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="mb-3 p-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50 cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
          onClick={() => onPageChange('deviceConfig')}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/30">
              <User className="h-4 w-4 text-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 flex-1"
                >
                  <p className="text-sm text-sidebar-foreground truncate font-medium">
                    {userEmail || 'User Account'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="ghost"
            className={`w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200 ${
              collapsed ? 'px-3' : 'px-4'
            }`}
            onClick={onSignOut}
          >
            <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm"
                >
                  {t.signOut}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}