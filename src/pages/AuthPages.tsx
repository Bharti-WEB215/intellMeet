import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { GlassCard } from '../components/GlassCard';
import { Sparkles, ArrowLeft, Mail, Lock, User, KeyRound, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthPages: React.FC = () => {
  const { authMode, setAuthMode, login, setCurrentView } = useStore();
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCodes, setOtpCodes] = useState(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(email);
    }, 1200);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthMode('otp');
    }, 1000);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please fill in your registered email.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Password reset instructions sent to ' + email);
      setAuthMode('login');
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joined = otpCodes.join('');
    if (joined.length < 4) {
      setErrorMsg('Please enter the 4-digit code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(email || 'new.user@intellmeet.io');
    }, 1200);
  };

  const handleOtpChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const codes = [...otpCodes];
    codes[index] = val.slice(-1);
    setOtpCodes(codes);
    // Autofocus next element
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const rightVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden text-[var(--theme-text)]">
      
      {/* Left panel: Vector branding (Linear style) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-[var(--theme-bg)] flex-col justify-between p-12 overflow-hidden border-r border-[var(--theme-divider)]">
        {/* Background grids */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(109,93,252,0.12)_0,transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--theme-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--theme-grid-line)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Header link back to landing */}
        <div 
          onClick={() => setCurrentView('landing')} 
          className="flex items-center space-x-2 cursor-pointer z-10"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center border border-[var(--theme-border)] shadow-md">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent">
            IntellMeet
          </span>
        </div>

        {/* Mid illustration widgets */}
        <div className="z-10 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-3xl font-black tracking-tight text-[var(--theme-text)] leading-tight">
              Welcome to the <br />
              Future of Team Sync.
            </h2>
            <p className="text-sm text-[var(--theme-text-secondary)] max-w-sm">
              Sign in to experience the AI Command Center, sentiment breakdowns, and Kanban-synced meeting report features.
            </p>
          </motion.div>

          <div className="space-y-4">
            <GlassCard className="border-[var(--theme-border)] bg-[var(--theme-surface-alt)] p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 border border-primary/30 p-2 rounded-lg text-primary mt-0.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[var(--theme-text)] font-mono">INTELL-ORB SYSTEM</h4>
                  <p className="text-[11px] text-[var(--theme-text-secondary)]">AI transcribed 14 tasks during design meeting today.</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="border-[var(--theme-border)] bg-[var(--theme-surface-alt)] p-4 max-w-sm translate-x-4">
              <div className="flex items-start gap-3">
                <div className="bg-secondary/20 border border-secondary/30 p-2 rounded-lg text-secondary mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[var(--theme-text)] font-mono">SECURITY PROTOCOL</h4>
                  <p className="text-[11px] text-[var(--theme-text-secondary)]">All transcripts are SOC-2 compliant and encrypted.</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-[var(--theme-text-muted)] z-10">
          <p>© 2026 IntellMeet AI Platforms Corp. Google DeepMind sandbox.</p>
        </div>
      </div>

      {/* Right panel: Forms */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center px-6 sm:px-16 py-12 relative">
        <button 
          onClick={() => setCurrentView('landing')}
          className="absolute top-6 left-6 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            
            {/* LOGIN STATE */}
            {authMode === 'login' && (
              <motion.div
                key="login"
                variants={rightVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Sign In</h1>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Enter your details to access your meetings</p>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-[var(--theme-text-secondary)]" />
                      <input 
                        type="email" 
                        required
                        placeholder="j.carter@stripe.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-10.5 pr-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[var(--theme-text)]">Password</label>
                      <button 
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[var(--theme-text-secondary)]" />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-10.5 pr-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-xl border border-primary/20 shadow-md cursor-pointer transition-colors mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                {/* Social Login Separator */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[var(--theme-divider)]"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-[var(--theme-text-muted)] font-bold uppercase tracking-wider">Or continue with</span>
                  <div className="flex-grow border-t border-[var(--theme-divider)]"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => login('google.user@stripe.com')}
                    className="flex items-center justify-center gap-2 border border-[var(--theme-border)] rounded-xl py-3 text-xs font-semibold hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer bg-[var(--theme-surface-alt)]"
                  >
                    <svg className="w-4 h-4 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.693 0-8.503-3.81-8.503-8.503s3.81-8.503 8.503-8.503c2.195 0 4.195.8 5.748 2.222L19.467 1.3A12.02 12.02 0 0012.24 0c-6.627 0-12 5.373-12 12s5.373 12 12 12c6.233 0 11.536-4.482 11.536-12 0-.852-.086-1.428-.24-1.715H12.24z"/>
                    </svg> Google
                  </button>
                  <button 
                    onClick={() => login('github.user@stripe.com')}
                    className="flex items-center justify-center gap-2 border border-[var(--theme-border)] rounded-xl py-3 text-xs font-semibold hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer bg-[var(--theme-surface-alt)]"
                  >
                    <svg className="w-4 h-4 text-[var(--theme-text)]" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg> GitHub
                  </button>
                </div>

                <p className="text-center text-xs text-[var(--theme-text-secondary)] mt-4">
                  New to IntellMeet?{' '}
                  <button onClick={() => setAuthMode('signup')} className="text-primary font-bold hover:underline">
                    Create Account
                  </button>
                </p>
              </motion.div>
            )}

            {/* SIGNUP STATE */}
            {authMode === 'signup' && (
              <motion.div
                key="signup"
                variants={rightVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Create Account</h1>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Join teams utilizing AI-driven workspaces</p>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]">Full Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-[var(--theme-text-secondary)]" />
                      <input 
                        type="text" 
                        required
                        placeholder="Julian Carter" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-10.5 pr-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-[var(--theme-text-secondary)]" />
                      <input 
                        type="email" 
                        required
                        placeholder="j.carter@stripe.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-10.5 pr-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]">Password</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[var(--theme-text-secondary)]" />
                      <input 
                        type="password" 
                        required
                        placeholder="Choose password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-10.5 pr-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-xl border border-primary/20 shadow-md cursor-pointer transition-colors mt-2"
                  >
                    Send Verification Code
                  </button>
                </form>

                <p className="text-center text-xs text-[var(--theme-text-secondary)] mt-4">
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-primary font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              </motion.div>
            )}

            {/* OTP VERIFICATION */}
            {authMode === 'otp' && (
              <motion.div
                key="otp"
                variants={rightVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Enter OTP Code</h1>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">We sent a 4-digit code to your email {email}</p>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="flex justify-center gap-4">
                    {otpCodes.map((code, idx) => (
                      <input 
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={code}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        className="w-16 h-16 bg-[var(--theme-input-bg)] border-2 border-[var(--theme-border)] rounded-2xl text-center text-2xl font-bold text-[var(--theme-text)] focus:outline-none focus:border-primary/80 transition-all font-mono"
                      />
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/95 text-slate-950 font-bold py-3 rounded-xl border border-accent/20 shadow-md cursor-pointer transition-colors"
                  >
                    Verify & Join
                  </button>
                </form>

                <p className="text-center text-xs text-[var(--theme-text-secondary)] mt-4">
                  Didn't receive code?{' '}
                  <button type="button" onClick={() => alert('OTP Code Resent')} className="text-primary font-bold hover:underline">
                    Resend Code
                  </button>
                </p>
              </motion.div>
            )}

            {/* FORGOT PASSWORD */}
            {authMode === 'forgot' && (
              <motion.div
                key="forgot"
                variants={rightVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text)]">Reset Password</h1>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Provide your registered email to reset password</p>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--theme-text)]">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-[var(--theme-text-secondary)]" />
                      <input 
                        type="email" 
                        required
                        placeholder="j.carter@stripe.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-10.5 pr-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-xl border border-primary/20 shadow-md cursor-pointer transition-colors mt-2"
                  >
                    Send Recovery Instructions
                  </button>
                </form>

                <p className="text-center text-xs text-[var(--theme-text-secondary)] mt-4">
                  Remember password?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-primary font-bold hover:underline">
                    Back to Sign In
                  </button>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
};
export default AuthPages;
