import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import FitVerseLogo from '../components/common/FitVerseLogo';

export default function Login() {
  const [email, setEmail] = useState('ananya@fitverse.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.unverified) {
        setUnverifiedEmail(respData.email || email);
        setError(respData.error || 'Your email address is not verified yet.');
      } else {
        setError(respData?.error || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('ananya@fitverse.com');
    setPassword('password123');
    setError('');
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      await login('ananya@fitverse.com', 'password123', true);
      navigate('/');
    } catch (err) {
      // If demo user is missing on fresh database, auto-register as verified demo
      try {
        await register('Ananya Sharma', 'ananya@fitverse.com', 'YogaStrongDemo@2026', 'YogaStrongDemo@2026');
        navigate(`/verify-email?email=ananya@fitverse.com`);
      } catch {
        setError('Could not initialize demo session. Please register a new account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fitverse-bg flex flex-col justify-center items-center p-4 md:p-6 select-none">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#F0E6F7] shadow-soft p-7 md:p-9 space-y-6">
        
        {/* Brand Header with Redesigned Logo */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <FitVerseLogo size="lg" showSubtitle={false} />
          <h2 className="text-2xl font-black text-fitverse-dark tracking-tight font-['Outfit'] mt-2">
            Welcome to FitVerse
          </h2>
          <p className="text-xs text-fitverse-muted font-medium">
            Sign in to continue your personalized yoga &amp; fitness sessions
          </p>
        </div>

        {/* Unverified Account Banner */}
        {unverifiedEmail && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Email Verification Required</span>
            </div>
            <p className="leading-relaxed">
              Your account for <strong className="text-amber-900">{unverifiedEmail}</strong> is awaiting 6-digit email confirmation.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
              className="inline-flex items-center gap-1.5 font-bold text-fitverse-purple hover:underline pt-1 cursor-pointer"
            >
              <span>Enter Verification Code Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* General Error Alert */}
        {error && !unverifiedEmail && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl pl-11 pr-4 py-3 text-sm text-fitverse-dark placeholder-fitverse-muted/60 focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/15 transition-all"
                required
              />
            </div>
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-fitverse-dark">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-fitverse-purple hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl pl-11 pr-11 py-3 text-sm text-fitverse-dark placeholder-fitverse-muted/60 focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/15 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-fitverse-muted hover:text-fitverse-purple transition-colors p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-fitverse-purple border-gray-300 focus:ring-fitverse-purple accent-fitverse-purple cursor-pointer"
              />
              <span className="text-xs font-medium text-fitverse-dark">Remember me on this computer</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fitverse-purple via-[#9658CE] to-[#7E3EB6] hover:from-[#9D66D4] hover:to-[#6C34A1] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo User Fast Login Button */}
        <div className="pt-2 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="text-xs font-bold text-fitverse-purple hover:underline cursor-pointer"
          >
            Continue as Demo User (Ananya) →
          </button>
        </div>

        {/* Link to Register */}
        <p className="text-center text-xs text-fitverse-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-fitverse-purple hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
