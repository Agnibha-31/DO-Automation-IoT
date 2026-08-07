import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import TransitionAnimation from './components/TransitionAnimation';
import { ThemeProvider } from './components/utils/themeContext';
import { Toaster } from './components/ui/sonner';
import { isDemoMode } from './components/utils/backend';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(isDemoMode());
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userEmail, setUserEmail] = useState<string | null>(isDemoMode() ? 'research.operator@example.org' : null);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setShowTransition(true);
  };

  const handleRegisterSuccess = () => {
    setAuthMode('login');
    setShowTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setIsAuthenticated(true);
  };

  return (
    <ThemeProvider>
      <div className="size-full min-h-screen bg-background text-foreground overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark" 
          toastOptions={{
            style: {
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-foreground)',
            },
          }}
        />
        <AnimatePresence mode="wait">
          {showTransition ? (
            <TransitionAnimation
              key="transition"
              onComplete={handleTransitionComplete}
            />
          ) : isAuthenticated ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="size-full"
            >
              <Dashboard 
                userEmail={userEmail}
                onSignOut={() => {
                  setIsAuthenticated(false);
                  setAuthMode('login');
                  setUserEmail(null);
                }} 
              />
            </motion.div>
          ) : authMode === 'register' ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="size-full"
            >
              <RegisterPage
                onRegistered={handleRegisterSuccess}
                onNavigateLogin={() => setAuthMode('login')}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="size-full"
            >
              <LoginPage 
                onLogin={handleLogin} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onNavigateRegister={() => setAuthMode('register')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}
