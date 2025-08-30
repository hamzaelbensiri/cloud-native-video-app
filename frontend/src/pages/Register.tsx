import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, UserRound, Lock, ShieldCheck } from 'lucide-react';

import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';

type Form = {
  email: string;
  username: string;
  password: string;
  confirm: string;
};

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { notify } = useToast();

  const [form, setForm] = useState<Form>({
    email: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [busy, setBusy] = useState(false);

  const passwordsMatch = form.password.length > 0 && form.password === form.confirm;
  const pwMin = form.password.length >= 8; // backend enforces >= 8
  const usernameMin = form.username.trim().length >= 3;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const canSubmit = useMemo(
    () => emailOk && usernameMin && pwMin && passwordsMatch && !busy,
    [emailOk, usernameMin, pwMin, passwordsMatch, busy]
  );

  const onChange = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    try {
      // 1) Register
      await api.post('/auth/register', {
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      });

      // 2) Auto-login (AuthContext handles token + user)
      await login(form.email.trim(), form.password);

      notify('Welcome! Account created.', 'success');
      nav('/'); // go to feed/home
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data?.detail) ? err.response.data.detail[0]?.msg : null) ||
        'Registration failed';
      notify(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Simple strength label
  const strength = useMemo(() => {
    const p = form.password;
    if (!p) return '';
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][Math.min(score, 5) - 1] || 'Very weak';
  }, [form.password]);

  return (
    <div className="bg-radial-vignette min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-md px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-brand-line bg-brand-card/80 p-5 shadow-card backdrop-blur"
        >
          <div className="mb-4 inline-flex items-center gap-2">
            <ShieldCheck className="text-brand-red" size={18} />
            <h1 className="display text-2xl text-white">Create your account</h1>
          </div>
          <p className="mb-5 text-sm text-neutral-400">
            Join as a <span className="text-neutral-200">consumer</span>. You can switch to{' '}
            <span className="text-neutral-200">creator</span> anytime from your profile.
          </p>

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <Field label="Email" icon={<Mail size={16} className="text-neutral-500" />}>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
                required
              />
            </Field>

            {/* Username */}
            <Field label="Username" icon={<UserRound size={16} className="text-neutral-500" />}>
              <input
                value={form.username}
                onChange={(e) => onChange({ username: e.target.value })}
                placeholder="username"
                className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
                required
                minLength={3}
              />
            </Field>

            {/* Password */}
            <Field label="Password (min 8 chars)" icon={<Lock size={16} className="text-neutral-500" />}>
              <div className="flex w-full items-center">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => onChange({ password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="ml-2 rounded-lg p-1 text-neutral-400 hover:bg-white/5"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Confirm */}
            <Field label="Confirm password" icon={<Lock size={16} className="text-neutral-500" />}>
              <div className="flex w-full items-center">
                <input
                  type={showPw2 ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => onChange({ confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((s) => !s)}
                  className="ml-2 rounded-lg p-1 text-neutral-400 hover:bg-white/5"
                  aria-label={showPw2 ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Hints */}
            <div className="space-y-1 text-xs">
              <div className={`text-neutral-400 ${pwMin ? 'text-neutral-300' : ''}`}>
                Strength: <span className="text-neutral-200">{form.password ? strength : '—'}</span>
              </div>
              {!passwordsMatch && form.confirm.length > 0 && (
                <div className="text-red-300">Passwords do not match.</div>
              )}
            </div>

            <Button type="submit" isLoading={busy} disabled={!canSubmit} className="w-full mt-2">
              Create account
            </Button>

            <p className="mt-3 text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <Link to="/login" className="text-neutral-200 underline underline-offset-4 hover:text-white">
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
        {icon}
        {children}
      </div>
    </div>
  );
}
