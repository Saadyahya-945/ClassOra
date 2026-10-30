import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isDemo: boolean;
}

const DEMO_USERS: Record<string, AppUser & { password: string }> = {
  'professor@classora.demo': {
    id: 'prof-arman-123',
    email: 'professor@classora.demo',
    fullName: 'Professor Arman',
    role: 'professor',
    password: 'professor123',
    isDemo: true,
  },
  'student@classora.demo': {
    id: 'student-user-rahul',
    email: 'student@classora.demo',
    fullName: 'Rahul Sharma',
    role: 'student',
    password: 'student123',
    isDemo: true,
  },
};

const STORAGE_KEY = 'classora-auth-user';

export function getStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;

  const rawUser = window.localStorage.getItem(STORAGE_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AppUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeUser(user: AppUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function signIn(
  email: string,
  password: string,
  role: UserRole
): Promise<{ user: AppUser | null; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const demoUser = DEMO_USERS[normalizedEmail];

  if (demoUser) {
    if (demoUser.password !== password || demoUser.role !== role) {
      return { user: null, error: 'The email, password, and role do not match.' };
    }

    const user: AppUser = {
      id: demoUser.id,
      email: demoUser.email,
      fullName: demoUser.fullName,
      role: demoUser.role,
      isDemo: demoUser.isDemo,
    };
    storeUser(user);
    return { user };
  }

  const supabase = createClient();
  if (!supabase) {
    return {
      user: null,
      error: 'Use the demo account or configure Supabase email/password authentication.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return { user: null, error: error?.message || 'Unable to sign in.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile || profile.role !== role) {
    await supabase.auth.signOut();
    return { user: null, error: profileError?.message || 'This account is not configured for the selected role.' };
  }

  const user: AppUser = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isDemo: false,
  };
  storeUser(user);
  return { user };
}

export async function signOut() {
  const supabase = createClient();
  if (supabase) await supabase.auth.signOut();
  clearStoredUser();
}
