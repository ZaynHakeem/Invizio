import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Package,
  ShieldCheck,
} from "lucide-react";
import { authAdapter, type AuthSession } from "../auth/adapter";
import { Brand, Spinner, ThemeSelect } from "./UI";

export function AuthScreen({
  onSession,
}: {
  onSession: (session: AuthSession) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [notice, setNotice] = useState("");
  function changeMode(next: typeof mode) {
    setMode(next);
    setErrors({});
    setNotice("");
    setPassword("");
    setShowPassword(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (mode !== "reset" && !password) next.password = "Enter your password.";
    else if (mode === "signup" && password.length < 8)
      next.password = "Use at least 8 characters.";
    setErrors(next);
    setNotice("");
    if (Object.keys(next).length) {
      document
        .getElementById(next.email ? "auth-email" : "auth-password")
        ?.focus();
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        await authAdapter.requestPasswordReset(email.trim());
        setNotice(
          "If an account uses this email, you’ll receive a password reset link.",
        );
      } else if (mode === "login") {
        const session = await authAdapter.signIn(email.trim(), password);
        setPassword("");
        onSession(session);
      } else {
        const result = await authAdapter.signUp(email.trim(), password);
        setPassword("");
        if (result.session) onSession(result.session);
        else if (result.verificationRequired)
          setNotice("Check your email to finish creating your account.");
        else
          throw new Error(
            "Account creation could not be confirmed. Please try again.",
          );
      }
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "We could not connect. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "login"
      ? "Welcome back."
      : mode === "signup"
        ? "Make room for growth."
        : "Let’s get you back in.";
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <ThemeSelect />
      </header>
      <main className="auth-layout">
        <section className="auth-story" aria-label="About Invizio">
          <span className="eyebrow">A clearer view of your business</span>
          <h1>
            Everything
            <br />
            in its place.
          </h1>
          <p>
            Know what you have. See what needs attention. Get back to what you
            do best.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="illustration-caption">
              <Package size={19} />
              <span>Your inventory, at a glance</span>
              <span className="tiny-dot" />
            </div>
            <div className="illustration-value">
              <span>Total inventory value</span>
              <strong>$828.66</strong>
              <small>4 items · 99 units</small>
            </div>
            <div className="illustration-bars">
              <i style={{ height: "72%" }} />
              <i style={{ height: "45%" }} />
              <i style={{ height: "25%" }} />
              <i style={{ height: "8%" }} />
            </div>
            <div className="illustration-note">
              <Check size={17} />A place for every detail.
            </div>
          </div>
          <div className="auth-benefits">
            <span>
              <Check size={16} />
              Stock that makes sense
            </span>
            <span>
              <Check size={16} />
              Fewer surprises
            </span>
          </div>
        </section>
        <section className="auth-form-section">
          <div className="auth-form-wrap">
            <span className="eyebrow">
              {mode === "signup"
                ? "Create your account"
                : mode === "reset"
                  ? "Password recovery"
                  : "Your workspace awaits"}
            </span>
            <h2>{title}</h2>
            <p className="muted">
              {mode === "login"
                ? "Sign in to keep your inventory in order."
                : mode === "signup"
                  ? "One simple place for your stock and its next step."
                  : "Enter your email to request a reset link."}
            </p>
            {!authAdapter.configured && (
              <div className="auth-preview-note">
                <ShieldCheck size={18} aria-hidden="true" />
                <p>
                  <strong>Accounts not connected yet.</strong> Add your Supabase
                  keys to <code>.env</code> to enable sign-in. Until then, no
                  credentials are sent or saved.
                </p>
              </div>
            )}
            <form noValidate onSubmit={submit} className="auth-form">
              <div className="field">
                <label htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((old) => ({
                      ...old,
                      email: undefined,
                      form: undefined,
                    }));
                  }}
                  placeholder="you@yourbusiness.com"
                  disabled={busy}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "auth-email-error" : undefined
                  }
                  required
                />
                {errors.email && (
                  <span className="field-error" id="auth-email-error">
                    {errors.email}
                  </span>
                )}
              </div>
              {mode !== "reset" && (
                <div className="field">
                  <label htmlFor="auth-password">Password</label>
                  <div className="password-field">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((old) => ({
                          ...old,
                          password: undefined,
                          form: undefined,
                        }));
                      }}
                      disabled={busy}
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password
                          ? "auth-password-error"
                          : mode === "signup"
                            ? "password-hint"
                            : undefined
                      }
                      required
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password ? (
                    <span className="field-error" id="auth-password-error">
                      {errors.password}
                    </span>
                  ) : (
                    mode === "signup" && (
                      <span className="field-hint" id="password-hint">
                        At least 8 characters.
                      </span>
                    )
                  )}
                </div>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  className="text-button auth-forgot"
                  onClick={() => changeMode("reset")}
                  disabled={busy}
                >
                  Forgot password?
                </button>
              )}
              {errors.form && (
                <div className="notice error" role="alert">
                  {errors.form}
                </div>
              )}
              {notice && (
                <div className="notice success" role="status">
                  {notice}
                </div>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? (
                  <Spinner />
                ) : (
                  <>
                    {mode === "login"
                      ? "Sign in"
                      : mode === "signup"
                        ? "Create account"
                        : "Send reset link"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
            <p className="auth-switch">
              {mode === "login"
                ? "New to Invizio?"
                : mode === "signup"
                  ? "Already have an account?"
                  : "Remember your password?"}{" "}
              <button
                className="text-button"
                onClick={() =>
                  changeMode(mode === "login" ? "signup" : "login")
                }
                disabled={busy}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <div className="auth-divider">
              <span>Just looking around?</span>
            </div>
            <Link className="button secondary full" to="/demo">
              Explore the demo
              <ArrowRight size={17} />
            </Link>
            <p className="micro centered">
              Sample inventory at{" "}
              <Link className="text-button" to="/demo">
                /demo
              </Link>
              . No signup. Changes stay in this tab.
            </p>
            <p className="auth-trust">
              <LockKeyhole size={14} aria-hidden="true" />
              Appearance is saved on this device. Passwords are not.
            </p>
          </div>
        </section>
      </main>
      <footer className="auth-footer">
        <span>Invizio · A little order. A lot of clarity.</span>
        <span>Built for the business you’re building.</span>
      </footer>
    </div>
  );
}
