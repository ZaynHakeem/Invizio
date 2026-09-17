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
}
const unavailable = async (): Promise<never> => {
  throw new Error(
    "Accounts are not connected yet. Try the demo to explore Invizio. No credentials were sent or saved.",
  );
};
export const authAdapter: AuthAdapter = {
  configured: false,
  signIn: unavailable,
  signUp: unavailable,
  requestPasswordReset: unavailable,
  signOut: async () => {},
};
