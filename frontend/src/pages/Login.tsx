import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { getHttpErrorMessage } from '@/lib/httpError';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.access_token, res.user);
      notify('Welcome back!', 'success');
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      notify(getHttpErrorMessage(err), 'error');
      console.error('[Login] error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-radial-vignette">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto w-full max-w-md rounded-2xl border border-brand-line bg-brand-card/80 p-6 shadow-card backdrop-blur"
        >
          <h1 className="display text-3xl text-white">Sign In</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Welcome back. Let’s get you to your shows.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">Email</label>
              <div className="flex items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
                <Mail size={16} className="text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs text-neutral-400">Password</label>
              <div className="flex items-center gap-2 rounded-2xl border border-brand-line bg-black/40 px-3 py-2">
                <Lock size={16} className="text-neutral-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-full">
              <span className="inline-flex items-center gap-2">
                <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}
              </span>
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-400">
            New here?{' '}
            <Link to="/register" className="text-white underline decoration-brand-red/50 underline-offset-2 hover:text-brand-red">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
