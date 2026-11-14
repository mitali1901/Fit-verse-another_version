import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import FitVerseLogo from '../components/common/FitVerseLogo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
          state: { email: email.trim().toLowerCase() }
        });
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not send reset code. Please check your email.';
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
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-fitverse-dark tracking-tight font-['Outfit'] mt-1">
            Forgot Password?
          </h2>
          <p className="text-xs text-fitverse-muted max-w-xs leading-relaxed">
            Enter your registered email address. We'll send a real 6-digit OTP to reset your password.
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
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Registered Email</label>
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

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fitverse-purple via-[#9658CE] to-[#7E3EB6] hover:from-[#9D66D4] hover:to-[#6C34A1] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-fitverse-muted pt-2 border-t border-gray-100">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-fitverse-purple hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

