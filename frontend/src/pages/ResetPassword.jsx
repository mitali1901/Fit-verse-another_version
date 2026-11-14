import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import FitVerseLogo from '../components/common/FitVerseLogo';
import PasswordStrengthIndicator, { evaluatePasswordStrength } from '../components/auth/PasswordStrengthIndicator';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || location.state?.email || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Email address is missing.');
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    const { isStrong, rules } = evaluatePasswordStrength(password);
    if (!isStrong) {
      const unmet = rules.filter(r => !r.met).map(r => r.label);
      setError(`New password must satisfy all strength criteria: ${unmet[0]}`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(email.trim().toLowerCase(), otp.trim(), password, confirmPassword);
      setSuccessMsg(res.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1600);
    } catch (err) {
      const msg = err.response?.data?.error || 'Password reset failed. Please check the code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fitverse-bg flex flex-col justify-center items-center p-4 md:p-6 select-none">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#F0E6F7] shadow-soft p-7 md:p-9 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <FitVerseLogo size="lg" showSubtitle={false} />
          <div className="w-14 h-14 rounded-2xl bg-fitverse-lavender p-3 flex items-center justify-center text-fitverse-purple mt-2 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-fitverse-dark tracking-tight font-['Outfit'] mt-1">
            Set New Password
          </h2>
          <p className="text-xs text-fitverse-muted max-w-xs leading-relaxed">
            Enter the 6-digit verification code sent to <strong className="text-fitverse-purple break-all">{email}</strong> and choose a new strong password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold leading-relaxed">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email verification field */}
          {!emailParam && (
            <div>
              <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl px-4 py-3 text-sm text-fitverse-dark focus:outline-none focus:border-fitverse-purple"
                required
              />
            </div>
          )}

          {/* 6-digit OTP code */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">6-Digit Verification Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 123456"
              className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl px-4 py-3 text-center text-xl font-black font-['Outfit'] tracking-widest text-fitverse-purple focus:outline-none focus:border-fitverse-purple"
              required
            />
            <p className="text-[11px] text-fitverse-muted mt-1 px-1">
              Code expires in 5 minutes (Maximum 5 attempts).
            </p>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create strong new password"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl pl-11 pr-11 py-3 text-sm text-fitverse-dark focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/15 transition-all"
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

            <PasswordStrengthIndicator password={password} showRules={true} />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl pl-11 pr-11 py-3 text-sm text-fitverse-dark focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/15 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-fitverse-muted hover:text-fitverse-purple transition-colors p-0.5 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 px-1">
                Passwords do not match yet.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fitverse-purple via-[#9658CE] to-[#7E3EB6] hover:from-[#9D66D4] hover:to-[#6C34A1] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Reset Password &amp; Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-fitverse-muted pt-2 border-t border-gray-100">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-fitverse-purple hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

