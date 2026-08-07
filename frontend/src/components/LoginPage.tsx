import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedInput from './AnimatedInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import DOSensorLogo from './DOSensorLogo';
import backend from './utils/backend';

interface LoginPageProps {
  onLogin: (email: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onNavigateRegister: () => void;
}

export default function LoginPage({ onLogin, isLoading, setIsLoading, onNavigateRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [autoPaused, setAutoPaused] = useState(false);
  const [lastFocused, setLastFocused] = useState<'email' | 'password' | null>(null);
  const autoTimer = useRef<number | null>(null);
  const lastAttempt = useRef<{ email: string; password: string } | null>(null);
  const loginInProgress = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const focusLastField = useCallback(() => {
    const target = lastFocused === 'password' ? passwordRef : emailRef;
    const node = target.current;
    if (node) {
      const len = node.value.length;
      node.focus();
      node.setSelectionRange(len, len);
    }
  }, [lastFocused]);

  const validateEmail = (value: string) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());
  const isEmailValid = validateEmail(email);
  const isLoginReady = isEmailValid && password.trim().length >= 8;

  const handleLogin = async () => {
    if (!isLoginReady) return;
    if (loginInProgress.current) return;
    if (lastAttempt.current && lastAttempt.current.email === email && lastAttempt.current.password === password) {
      return;
    }

    loginInProgress.current = true;
    setIsLoading(true);
    setError('');
    setShowError(false);

    try {
      const result = await backend.login(email.trim(), password.trim());
      backend.setAccessToken(result.token);
      lastAttempt.current = { email, password };
      onLogin(email.trim());
    } catch (err: any) {
      const rawMessage = err?.message || 'Authentication failed';
      const normalized = rawMessage.toLowerCase();
      const friendlyMessage =
        normalized.includes('not found') || normalized.includes('not registered') || normalized.includes('404')
          ? 'User not registered. Please register to continue.'
          : rawMessage;

      if (autoTimer.current) {
        window.clearTimeout(autoTimer.current);
        autoTimer.current = null;
      }
      setError(friendlyMessage);
      setShowError(true);
      setAutoPaused(true);
      window.setTimeout(() => focusLastField(), 50);
      setTimeout(() => setShowError(false), 4000);
    }

    setIsLoading(false);
    loginInProgress.current = false;
  };

  // Auto-login when credentials are valid
  useEffect(() => {
    // Clear any existing timer
    if (autoTimer.current) {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }

    // Don't auto-login if paused, not ready, already loading, or in progress
    if (autoPaused || !isLoginReady || isLoading || loginInProgress.current) {
      return;
    }

    // Check if we already tried these credentials
    if (lastAttempt.current && lastAttempt.current.email === email && lastAttempt.current.password === password) {
      return;
    }

    // Set new timer
    autoTimer.current = window.setTimeout(() => {
      handleLogin();
    }, 800);

    return () => {
      if (autoTimer.current) {
        window.clearTimeout(autoTimer.current);
        autoTimer.current = null;
      }
    };
  }, [email, password]);

  const handleSendReset = async () => {
    setResetMessage('');
    setResetError('');
    if (!validateEmail(resetEmail)) {
      setResetError('Enter a valid email to reset password.');
      return;
    }
    try {
      const resp = await backend.forgotPassword(resetEmail.trim());
      setResetMessage(resp.message + (resp.reset_token ? ` Reset Token: ${resp.reset_token}` : ''));
    } catch (err: any) {
      setResetError(err?.message || 'Unable to start reset.');
    }
  };

  const handleResetPassword = async () => {
    setResetMessage('');
    setResetError('');
    if (!validateEmail(resetEmail)) {
      setResetError('Enter a valid email.');
      return;
    }
    if (!resetToken.trim()) {
      setResetError('Enter the reset token.');
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetError('New password must be at least 8 characters.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    try {
      const resp = await backend.resetPassword(resetEmail.trim(), resetToken.trim(), resetNewPassword.trim());
      setResetMessage(resp.message || 'Password reset successful. You can now login.');
    } catch (err: any) {
      setResetError(err?.message || 'Unable to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 animate-pulse" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-card/80 backdrop-blur-xl shadow-2xl border border-border/30 shadow-green-500/10">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center justify-center mb-4"
            >
              <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.3 }}>
                <DOSensorLogo size={48} animated={true} />
              </motion.div>
            </motion.div>
            <CardTitle className="text-2xl text-foreground mb-2">
              RS-LDO-N01 Sensor Dashboard
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Welcome to the Dissolved Oxygen Sensor IoT Monitoring System
            </CardDescription>
            <div className="mt-4">
              <CardDescription className="text-muted-foreground">
                Please enter your credentials
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <label className="block text-sm text-foreground mb-2 text-center">Email</label>
              <div className="w-80">
                <AnimatedInput
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAutoPaused(false);
                    setShowError(false);
                  }}
                  onFocus={() => setLastFocused('email')}
                  inputRef={emailRef}
                  placeholder="Enter email"
                  className="w-full pr-10 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <label className="block text-sm text-foreground mb-2 text-center">Password</label>
              <div className="w-80 relative">
                <AnimatedInput
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAutoPaused(false);
                    setShowError(false);
                  }}
                  onFocus={() => setLastFocused('password')}
                  inputRef={passwordRef}
                  placeholder="Enter password"
                  className="w-full pr-12 transition-all duration-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-400 text-center mt-1">Password must be at least 8 characters.</p>
              )}
            </motion.div>

            {/* Auto Login Indicator intentionally removed per request */}

            {/* Forgot Password Toggle */}
            <div className="text-center text-sm mt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-primary font-medium decoration-2 underline-offset-4 hover:underline hover:text-primary/80 transition-colors"
                onClick={() => {
                  setShowForgot((prev) => !prev);
                  setResetMessage('');
                  setResetError('');
                }}
              >
                {showForgot ? 'Hide forgot password' : 'Forgot password?'}
              </motion.button>
            </div>

            <AnimatePresence>
              {showForgot && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg border border-border/50 bg-card/60 p-4 space-y-2"
                >
                  <p className="text-sm text-foreground font-semibold text-center">Reset your password</p>
                  <AnimatedInput
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Your registered email"
                    className="w-full"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handleSendReset}
                      className="w-full sm:w-auto px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Send reset token
                    </button>
                    <span className="text-xs text-muted-foreground">Token valid for 15 minutes</span>
                  </div>

                  <AnimatedInput
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token"
                    className="w-full"
                  />
                  <AnimatedInput
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full"
                  />
                  <AnimatedInput
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors"
                    >
                      Reset password
                    </button>
                  </div>
                  {resetMessage && (
                    <p className="text-xs text-emerald-400 text-center">{resetMessage}</p>
                  )}
                  {resetError && (
                    <p className="text-xs text-red-400 text-center">{resetError}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Alert */}
            <AnimatePresence>
              {showError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Register link */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center text-sm text-muted-foreground pt-4 border-t border-border"
            >
              <p>
                Not registered?{' '}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={onNavigateRegister}
                  className="text-primary font-medium decoration-2 underline-offset-4 hover:underline hover:text-primary/80 transition-colors"
                >
                  Register
                </motion.button>
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-center text-xs text-muted-foreground pt-2"
            >
              <span>Authorized personnel only</span>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-center mt-6 text-muted-foreground text-sm relative z-10"
        >
          © 2025 Advanced IoT Solutions. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
}