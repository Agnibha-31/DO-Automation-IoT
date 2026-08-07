import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './Sidebar';
import Header from './Header';
import HomePage from './pages/HomePage';
import OldDOPage from './pages/OldDOPage';
import NewDOPage from './pages/NewDOPage';
import TemperaturePage from './pages/TemperaturePage';
import PressurePage from './pages/PressurePage';
import DOSaturationPage from './pages/DOSaturationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DataDownloadPage from './pages/DataDownloadPage';
import SettingsPage from './pages/SettingsPage';
import DeviceConfigPage from './pages/DeviceConfigPage';

interface DashboardProps {
  onSignOut: () => void;
  userEmail?: string | null;
}

export type PageType = 'home' | 'oldDO' | 'newDO' | 'temperature' | 'pressure' | 'doSaturation' | 'analytics' | 'dataDownload' | 'settings' | 'deviceConfig';

export default function Dashboard({ onSignOut, userEmail }: DashboardProps) {
  const validPages: PageType[] = ['home', 'oldDO', 'newDO', 'temperature', 'pressure', 'doSaturation', 'analytics', 'dataDownload', 'settings', 'deviceConfig'];
  const requestedPage = new URLSearchParams(window.location.search).get('page') as PageType | null;
  const [currentPage, setCurrentPage] = useState<PageType>(requestedPage && validPages.includes(requestedPage) ? requestedPage : 'home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [startTime] = useState(new Date());

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const renderPage = () => {
    const pageVariants = {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };

    const transition = { duration: 0.3, ease: "easeInOut" };

    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'oldDO':
        return <OldDOPage />;
      case 'newDO':
        return <NewDOPage />;
      case 'temperature':
        return <TemperaturePage />;
      case 'pressure':
        return <PressurePage />;
      case 'doSaturation':
        return <DOSaturationPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'dataDownload':
        return <DataDownloadPage />;
      case 'settings':
        return <SettingsPage />;
      case 'deviceConfig':
        return <DeviceConfigPage onSignOut={onSignOut} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSignOut={onSignOut}
        userEmail={userEmail}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Header startTime={startTime} />
        
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full overflow-y-auto overflow-x-hidden p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
