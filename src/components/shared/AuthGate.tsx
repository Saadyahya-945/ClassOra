'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut } from 'lucide-react';
import { AppUser, getStoredUser, signIn, signOut } from '@/lib/auth';
import { UserRole } from '@/types/database';

interface AuthGateProps {
  role: UserRole;
  children: (user: AppUser) => ReactNode;
}

export function AuthGate({ role, children }: AuthGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [email, setEmail] = useState(role === 'professor' ? 'professor@classora.demo' : 'student@classora.demo');
  const [password, setPassword] = useState(role === 'professor' ? 'professor123' : 'student123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedUser = getStoredUser();
      setUser(storedUser?.role === role ? storedUser : null);
      setIsLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [role]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await signIn(email, password, role);
    if (!result.user) setError(result.error || 'Unable to sign in.');
    else setUser(result.user);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push('/');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-sm">Checking access...</div>;
  }

  if (!user) {
    const isProfessor = role === 'professor';
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border-2 border-[#0F172A] shadow-[5px_5px_0px_#0F172A] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold text-blue-700 uppercase">ClassOra access</p>
              <h1 className="font-display text-3xl font-black mt-1">{isProfessor ? 'Professor login' : 'Student login'}</h1>
            </div>
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-[#475569]">
            Sign in before entering the {isProfessor ? 'teaching' : 'student'} dashboard.
          </p>
          <label className="block space-y-1">
            <span className="font-mono text-xs font-bold">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full border-2 border-[#0F172A] px-3 py-2 font-mono text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs font-bold">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="w-full border-2 border-[#0F172A] px-3 py-2 font-mono text-sm" />
          </label>
          {error && <p className="border-2 border-rose-600 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <button disabled={isLoading} className="w-full border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-[#0F172A] hover:text-white transition-all font-bold shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 px-4 py-3 font-mono disabled:opacity-50">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-xs text-[#64748B] font-mono">
            Demo: {isProfessor ? 'professor@classora.demo / professor123' : 'student@classora.demo / student123'}
          </p>
          <Link href="/" className="block text-center text-sm font-mono underline">Back to home</Link>
        </form>
      </main>
    );
  }

  return (
    <>
      <div className="fixed bottom-3 right-3 z-50">
        <button onClick={handleSignOut} className="flex items-center gap-2 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-[#0F172A] hover:text-white transition-all font-bold shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 px-3 py-2 font-mono text-xs">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
      {children(user)}
    </>
  );
}
