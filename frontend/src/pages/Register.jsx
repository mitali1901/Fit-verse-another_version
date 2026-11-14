import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import FitVerseLogo from '../components/common/FitVerseLogo';
import PasswordStrengthIndicator, { evaluatePasswordStrength } from '../components/auth/PasswordStrengthIndicator';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend strong password validation check
    const { isStrong, rules } = evaluatePasswordStrength(password);
    if (!isStrong) {
      const unmet = rules.filter(r => !r.met).map(r => r.label);
      setError(`Password must satisfy all strength criteria: ${unmet[0]}`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, confirmPassword);
      // Redirect to email verification page with registered email
      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
        state: { email: email.trim().toLowerCase(), name: name.trim() }
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0] ||
        'Registration failed. Please check your details and try again.';
      setError(errorMsg);
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
            Create an Account
          </h2>
          <p className="text-xs text-fitverse-muted font-medium">
            Join FitVerse to unlock your mindful yoga journey with AI posture detection
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Patel"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl pl-11 pr-4 py-3 text-sm text-fitverse-dark placeholder-fitverse-muted/60 focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/15 transition-all"
                required
              />
            </div>
          </div>

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
            <p className="text-[11px] text-fitverse-muted mt-1 px-1">
              A real 6-digit OTP verification code will be sent to this email.
            </p>
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
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

            {/* Mandatory Live Password Strength Meter */}
            <PasswordStrengthIndicator password={password} showRules={true} />
          </div>

          {/* Confirm Password with Show/Hide toggle */}
          <div>
            <label className="block text-xs font-bold text-fitverse-dark mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-fitverse-muted absolute left-4 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl pl-11 pr-11 py-3 text-sm text-fitverse-dark placeholder-fitverse-muted/60 focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/15 transition-all"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fitverse-purple via-[#9658CE] to-[#7E3EB6] hover:from-[#9D66D4] hover:to-[#6C34A1] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer mt-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account & Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-center text-xs text-fitverse-muted pt-2 border-t border-gray-100">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-fitverse-purple hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
