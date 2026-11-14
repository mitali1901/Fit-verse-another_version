import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import FitVerseLogo from '../components/common/FitVerseLogo';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendOtp } = useAuth();

  // Extract email from query param or router state
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || location.state?.email || '';

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 5-minute OTP expiration timer (300 seconds)
  const [expirySeconds, setExpirySeconds] = useState(300);
  // 60-second resend cooldown timer
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Expiration countdown effect
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expirySeconds]);

  // Resend cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Handle individual digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted multiple characters into a single box
      const chars = cleaned.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = c;
        }
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(5, index + chars.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setError('');

    // Advance focus to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full code
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    pasted.split('').forEach((char, idx) => {
      newDigits[idx] = char;
    });
    setOtpDigits(newDigits);
    setError('');
    const nextIndex = Math.min(5, pasted.length);
    inputRefs.current[nextIndex]?.focus();
  };

  // Submit OTP Verification
  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please re-enter your email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyEmail(email, fullOtp);
      setSuccessMsg(res.message || 'Account activated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed. Please check the code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP Code
  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;
    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await resendOtp(email, 'email_verification');
      setSuccessMsg(res.message || 'A fresh verification code has been dispatched to your email.');
      setOtpDigits(['', '', '', '', '', '']);
      setExpirySeconds(300); // Reset 5-minute timer
      setCooldownSeconds(60); // Reset 60s cooldown
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not resend verification code. Please wait before trying again.';
      setError(msg);
      if (err.response?.data?.cooldown_remaining) {
        setCooldownSeconds(err.response.data.cooldown_remaining);
      }
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-fitverse-bg flex flex-col justify-center items-center p-4 md:p-6 select-none">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#F0E6F7] shadow-soft p-7 md:p-9 space-y-6 text-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2">
          <FitVerseLogo size="lg" showSubtitle={false} />
          <div className="w-14 h-14 rounded-2xl bg-fitverse-lavender p-3 flex items-center justify-center text-fitverse-purple mt-2 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-fitverse-dark tracking-tight font-['Outfit'] mt-1">
            Verify Your Email
          </h2>
          <p className="text-xs text-fitverse-muted max-w-xs leading-relaxed">
            We sent a 6-digit verification code to:
            <br />
            <strong className="text-fitverse-purple font-bold break-all">{email || 'your email'}</strong>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* 6-Digit OTP Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-14 sm:w-12 sm:h-15 text-center text-xl sm:text-2xl font-black font-['Outfit'] rounded-2xl border-2 transition-all ${
                  digit
                    ? 'border-fitverse-purple bg-[#FAF5FD] text-fitverse-dark shadow-xs'
                    : 'border-[#EADBFA] bg-[#FAF6FD] text-fitverse-dark focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/20'
                }`}
              />
            ))}
          </div>

          {/* Expiration Timer display */}
          <div className="flex items-center justify-between text-xs px-2 text-fitverse-muted">
            <span>Code Expiration:</span>
            <span
              className={`font-bold font-['Outfit'] ${
                expirySeconds <= 60 ? 'text-rose-600 font-extrabold animate-pulse' : 'text-fitverse-purple'
              }`}
            >
              ⏱️ {formatTimer(expirySeconds)}
            </span>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6 || expirySeconds <= 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fitverse-purple via-[#9658CE] to-[#7E3EB6] hover:from-[#9D66D4] hover:to-[#6C34A1] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Cooldown Section */}
        <div className="pt-2 border-t border-gray-100 flex flex-col items-center gap-2 text-xs">
          <p className="text-fitverse-muted">Didn't receive the email? Check spam folder or resend.</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || resending}
            className={`font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              cooldownSeconds > 0
                ? 'text-fitverse-muted cursor-not-allowed opacity-60'
                : 'text-fitverse-purple hover:underline'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>
              {cooldownSeconds > 0 ? `Resend Code in ${cooldownSeconds}s` : 'Resend Code Now'}
            </span>
          </button>
        </div>

        {/* Return to Login */}
        <p className="text-xs text-fitverse-muted">
          Need to change email?{' '}
          <Link to="/register" className="font-bold text-fitverse-purple hover:underline">
            Register again
          </Link>
          {' · '}
          <Link to="/login" className="font-bold text-fitverse-purple hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

