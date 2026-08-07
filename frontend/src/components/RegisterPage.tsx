import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedInput from './AnimatedInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import DOSensorLogo from './DOSensorLogo';
import backend from './utils/backend';

interface RegisterPageProps {
  onRegistered: () => void;
  onNavigateLogin: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function RegisterPage({ onRegistered, onNavigateLogin, isLoading, setIsLoading }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const validateName = (fullName: string) => {
    const trimmed = fullName.trim();
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    return {
      hasTwoWords: words.length >= 2,
      allCapitalized: words.every((word) => /^[A-Z]/.test(word)),
      isValid: words.length >= 2 && words.every((word) => /^[A-Z]/.test(word)),
    };
  };

  const validateEmail = (emailStr: string) => {
    const trimmed = emailStr.trim();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return {
      hasValidFormat: emailRegex.test(trimmed),
      hasAtSymbol: trimmed.includes('@'),
      hasDomain: trimmed.split('@').length === 2 && trimmed.split('@')[1].includes('.'),
      isValid: emailRegex.test(trimmed),
    };
  };

  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  };

  const nameValidation = validateName(name);
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const isFormValid = nameValidation.isValid && emailValidation.isValid && isPasswordValid && passwordsMatch;

  const handleRegister = async () => {
    setError('');
    setShowError(false);
    if (!name.trim()) {
      setError('Please enter your full name.');
      setShowError(true);
      return;
    }
    if (!nameValidation.hasTwoWords) {
      setError('Enter at least 2 words');
      setShowError(true);
      return;
    }
    if (!nameValidation.allCapitalized) {
      setError('Each word must start with a capital letter');
      setShowError(true);
      return;
    }

    if (!emailValidation.hasAtSymbol) {
      setError('Email must contain @ symbol');
      setShowError(true);
      return;
    }
    if (!emailValidation.hasDomain) {
      setError('Enter a valid email domain (e.g., @gmail.com)');
      setShowError(true);
      return;
    }
    if (!emailValidation.hasValidFormat) {
      setError('Enter a valid email format');
      setShowError(true);
      return;
    }

    if (!passwordValidation.minLength) {
      setError('Password must be at least 8 characters.');
      setShowError(true);
      return;
    }
    if (!passwordValidation.hasUpper) {
      setError('Password must include at least one uppercase letter.');
      setShowError(true);
      return;
    }
    if (!passwordValidation.hasLower) {
      setError('Password must include at least one lowercase letter.');
      setShowError(true);
      return;
    }
    if (!passwordValidation.hasNumber) {
      setError('Password must include at least one number.');
      setShowError(true);
      return;
    }
    if (!passwordValidation.hasSpecial) {
      setError('Password must include at least one special character.');
      setShowError(true);
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      setShowError(true);
      return;
    }

    setIsLoading(true);
    try {
      await backend.register(email.trim(), password.trim(), name.trim());
      onRegistered();
    } catch (err: any) {
      const rawMessage = err?.message || 'Registration failed. Please try again.';
      const normalized = rawMessage.toLowerCase();
      const friendlyMessage =
        normalized.includes('exist') || normalized.includes('already') || normalized.includes('duplicate')
          ? 'This email is already registered. Please sign in or use a different email.'
          : rawMessage;

      setError(friendlyMessage);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 animate-pulse" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
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
              Create your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <label className="block text-sm text-foreground mb-2 text-center">Full Name</label>
              <div className="w-80">
                <AnimatedInput
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
              {name && !nameValidation.isValid && (
                <p className="text-xs text-red-400 text-center mt-1">
                  {!nameValidation.hasTwoWords && 'Enter at least 2 words'}
                  {nameValidation.hasTwoWords && !nameValidation.allCapitalized && 'Each word must start with a capital letter'}
                </p>
              )}
            </motion.div>

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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full transition-all duration-300"
                  disabled={isLoading || !nameValidation.isValid}
                />
              </div>
              {email && !emailValidation.isValid && (
                <p className="text-xs text-red-400 text-center mt-1">
                  {!emailValidation.hasAtSymbol && 'Email must contain @ symbol'}
                  {emailValidation.hasAtSymbol && !emailValidation.hasDomain && 'Enter a valid email domain (e.g., @gmail.com)'}
                  {emailValidation.hasDomain && !emailValidation.hasValidFormat && 'Enter a valid email format'}
                </p>
              )}
            </motion.div>

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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pr-12 transition-all duration-300"
                  disabled={isLoading || !emailValidation.isValid}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <AnimatePresence>
                  {password && !isPasswordValid && (
                    <motion.div
                      key="pwd-pop"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 right-0 mt-2 rounded-md border border-border bg-card/95 shadow-lg p-3 text-xs text-foreground"
                    >
                      <p className="mb-2 font-semibold text-center">Password must include:</p>
                      <ul className="space-y-1 text-left">
                        <li className={passwordValidation.minLength ? 'text-emerald-400' : 'text-red-400'}>
                          {passwordValidation.minLength ? '✓' : '✗'} At least 8 characters
                        </li>
                        <li className={passwordValidation.hasUpper ? 'text-emerald-400' : 'text-red-400'}>
                          {passwordValidation.hasUpper ? '✓' : '✗'} One uppercase letter (A-Z)
                        </li>
                        <li className={passwordValidation.hasLower ? 'text-emerald-400' : 'text-red-400'}>
                          {passwordValidation.hasLower ? '✓' : '✗'} One lowercase letter (a-z)
                        </li>
                        <li className={passwordValidation.hasNumber ? 'text-emerald-400' : 'text-red-400'}>
                          {passwordValidation.hasNumber ? '✓' : '✗'} One number (0-9)
                        </li>
                        <li className={passwordValidation.hasSpecial ? 'text-emerald-400' : 'text-red-400'}>
                          {passwordValidation.hasSpecial ? '✓' : '✗'} One special character (!@#$%^&*)
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <label className="block text-sm text-foreground mb-2 text-center">Confirm Password</label>
              <div className="w-80 relative">
                <AnimatedInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pr-12 transition-all duration-300"
                  disabled={isLoading || !isPasswordValid}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1 text-center">
                  Passwords do not match
                </p>
              )}
            </motion.div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={isLoading || !isFormValid}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating account...
                </span>
              ) : (
                'Register'
              )}
            </button>

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

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center text-sm text-muted-foreground pt-4 border-t border-border"
            >
              <p>
                Already registered?{' '}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={onNavigateLogin}
                  className="text-primary font-medium decoration-2 underline-offset-4 hover:underline hover:text-primary/80 transition-colors"
                >
                  Sign in
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
