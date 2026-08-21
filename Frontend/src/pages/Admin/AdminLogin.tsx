import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminAPI } from '../../api/admin';

type ViewState = 'login' | '2fa' | 'forgot-loading' | 'forgot-otp' | 'forgot-reset';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const [view, setView] = useState<ViewState>('login');
  
  // Forgot password states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    setView('forgot-loading');
    
    try {
      const res = await AdminAPI.forgotPassword();

      if (res.success) {
        setView('forgot-otp');
        setSuccessMsg('Reset code sent to your configured admin email.');
      } else {
        setError(res.message || 'Failed to initiate password reset.');
        setView('login');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setView('login');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await AdminAPI.verifyResetOtp(resetCode);

      if (res.success) {
        setView('forgot-reset');
        setSuccessMsg('Code verified. Enter your new password.');
      } else {
        setError(res.message || 'Invalid or expired code.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await AdminAPI.resetPassword(resetCode, newPassword);

      if (res.success) {
        setView('login');
        setSuccessMsg('Password has been reset successfully. You can now log in.');
        setResetCode('');
        setNewPassword('');
        setPassword('');
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (view === '2fa') {
        const res = await AdminAPI.verify2FALogin(email, password, twoFactorCode);
        if (res.success && res.token) {
          localStorage.setItem('adminToken', res.token);
          navigate('/admin');
        } else {
          setError(res.message || 'Invalid 2FA code');
        }
      } else {
        const res = await AdminAPI.login(email, password);
        if (res.success) {
          if (res.requires2FA) {
            setView('2fa');
          } else if (res.token) {
            localStorage.setItem('adminToken', res.token);
            navigate('/admin');
          }
        } else {
          setError(res.message || 'Invalid credentials');
        }
      }
    } catch (err: any) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setView('login');
    setError('');
    setSuccessMsg('');
    setResetCode('');
    setNewPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
        <div className="mb-10 mt-4 flex justify-center">
          <img src="/logo-light.png" alt="Waflow" className="h-14 w-auto object-contain scale-[1.8]" />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-100">
            {successMsg}
          </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-black transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2FA VIEW */}
        {view === '2fa' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Two-Factor Authentication</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Enter the 6-digit code from your authenticator app.</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full px-4 py-3 text-center tracking-[0.5em] text-xl font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <button 
                type="button" 
                onClick={resetToLogin}
                className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-black font-semibold mt-2"
              >
                ← Back to Login
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD: LOADING */}
        {view === 'forgot-loading' && (
          <div className="space-y-6 animate-in fade-in text-center py-6">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sending Reset Code...</p>
          </div>
        )}

        {/* FORGOT PASSWORD: OTP */}
        {view === 'forgot-otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Verification Code</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Check your email for the 6-digit reset code.</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-4 py-3 text-center tracking-[0.5em] text-xl font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <button 
                type="button" 
                onClick={resetToLogin}
                className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-black font-semibold mt-2"
              >
                ← Back to Login
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD: RESET */}
        {view === 'forgot-reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="space-y-1.5 text-center mb-4">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Set New Password</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create a secure password for your admin portal.</p>
              </div>
              <div className="space-y-1.5">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                  placeholder="New Password"
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AdminLogin;
