import { getSupabase, supabaseConfigured } from "./supabase";

// Replace this adapter when your account backend is ready. The UI does not
// persist passwords, invent sessions, or claim that the existing API is protected.
export interface AuthSession {
  email: string;
  accessToken: string;
}

export interface AuthAdapter {
  configured: boolean;
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(
    email: string,
    password: string,
  ): Promise<{ session?: AuthSession; verificationRequired?: boolean }>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  updatePassword(password: string): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onSessionChange(
    listener: (session: AuthSession | null, event?: string) => void,
  ): () => void;
}

function fromSupabaseSession(session: {
  access_token: string;
  user: { email?: string | null };
}): AuthSession | null {
  const email = session.user.email?.trim();
  if (!email || !session.access_token) return null;
  return { email, accessToken: session.access_token };
}

function authErrorMessage(error: { message?: string } | null): string {
  const message = error?.message?.trim();
  if (!message) return "We could not connect. Please try again.";
  if (/invalid login credentials/i.test(message))
    return "Incorrect email or password.";
  if (/email not confirmed/i.test(message))
    return "Confirm your email before signing in.";
  if (/user already registered/i.test(message))
    return "An account already exists for this email. Sign in instead.";
  return message;
}

const unavailable = async (): Promise<never> => {
  throw new Error(
    "Accounts are not connected yet. Open /demo to explore Invizio. No credentials were sent or saved.",
  );
};

const unconfiguredAdapter: AuthAdapter = {
  configured: false,
  signIn: unavailable,
  signUp: unavailable,
  requestPasswordReset: unavailable,
  signOut: async () => {},
  updatePassword: unavailable,
  getSession: async () => null,
  onSessionChange: () => () => {},
};

function createSupabaseAdapter(): AuthAdapter {
  return {
    configured: true,
    async signIn(email, password) {
      const supabase = getSupabase();
      if (!supabase) return unavailable();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(authErrorMessage(error));
      const session = data.session && fromSupabaseSession(data.session);
      if (!session) throw new Error("Sign-in did not return a session.");
      return session;
    },
    async signUp(email, password) {
      const supabase = getSupabase();
      if (!supabase) return unavailable();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(authErrorMessage(error));
      if (data.session) {
        const session = fromSupabaseSession(data.session);
        if (session) return { session };
      }
      return { verificationRequired: true };
    },
    async requestPasswordReset(email) {
      const supabase = getSupabase();
      if (!supabase) return unavailable();
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw new Error(authErrorMessage(error));
    },
    async signOut() {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signOut();
    },
    async updatePassword(password) {
      const supabase = getSupabase();
      if (!supabase) return unavailable();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(authErrorMessage(error));
    },
    async getSession() {
      const supabase = getSupabase();
      if (!supabase) return null;
      const { data } = await supabase.auth.getSession();
      return data.session ? fromSupabaseSession(data.session) : null;
    },
    onSessionChange(listener) {
      const supabase = getSupabase();
      if (!supabase) return () => {};
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        listener(session ? fromSupabaseSession(session) : null, event);
      });
      return () => subscription.unsubscribe();
    },
  };
}

export const authAdapter: AuthAdapter = supabaseConfigured
  ? createSupabaseAdapter()
  : unconfiguredAdapter;
