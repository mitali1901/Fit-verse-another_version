import React from 'react';
import { Check, X } from 'lucide-react';

export function evaluatePasswordStrength(password = '') {
  const rules = [
    { id: 'length', label: 'Minimum 8 characters', met: password.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'At least one number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'At least one special character (!@#$%...)', met: /[!@#$%^&*(),.?":{}|<>\-_+=\\~`[\]/]/.test(password) },
  ];

  const metCount = rules.filter(r => r.met).length;
  const isLengthMet = password.length >= 8;

  let level = 'empty';
  let label = '';
  let color = 'bg-gray-200';
  let textColor = 'text-gray-400';

  if (password.length > 0) {
    if (!isLengthMet || metCount <= 2) {
      level = 'weak';
      label = 'Weak Password';
      color = 'bg-rose-500';
      textColor = 'text-rose-600';
    } else if (metCount === 3 || metCount === 4) {
      level = 'medium';
      label = 'Medium Password';
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
    } else if (metCount === 5) {
      level = 'strong';
      label = 'Strong Password';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-600';
    }
  }

  const isStrong = metCount === 5;

  return { rules, metCount, level, label, color, textColor, isStrong };
}

export default function PasswordStrengthIndicator({ password = '', showRules = true }) {
  if (!password) return null;

  const { rules, level, label, textColor } = evaluatePasswordStrength(password);

  return (
    <div className="space-y-2 mt-2 pt-1 animate-in fade-in duration-200">
      {/* 3-segment strength meter */}
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-fitverse-muted">Password Strength:</span>
        <span className={`font-bold text-xs ${textColor}`}>{label}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 h-1.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            level === 'weak'
              ? 'bg-rose-500'
              : level === 'medium'
              ? 'bg-amber-500'
              : level === 'strong'
              ? 'bg-emerald-500'
              : 'bg-gray-200'
          }`}
        />
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            level === 'medium'
              ? 'bg-amber-500'
              : level === 'strong'
              ? 'bg-emerald-500'
              : 'bg-gray-200'
          }`}
        />
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            level === 'strong' ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
        />
      </div>

      {/* Mandatory Criteria Checklist */}
      {showRules && (
        <div className="bg-[#FAF6FD] rounded-xl p-2.5 border border-[#F0E6F7] space-y-1 mt-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 text-[11px] leading-tight">
              {rule.met ? (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
              )}
              <span className={`font-medium ${rule.met ? 'text-fitverse-dark font-semibold' : 'text-fitverse-muted'}`}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

