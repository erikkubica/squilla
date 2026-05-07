import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useBranding, type Branding } from "@/hooks/use-branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  getAdminAuthConfig,
  adminRegister,
  adminForgotPassword,
  adminResetPassword,
  type AdminAuthConfig,
} from "@/api/client";

// Branded card chrome shared by every public auth surface (sign in, sign
// up, forgot, reset). Keeps the favicon + site title rendering in one
// place and means the operator's soft-brand changes flow into every
// auth screen automatically.
function AuthShell({
  branding,
  title,
  description,
  children,
  footer,
}: {
  branding: Branding;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--app-bg)" }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden"
            style={{
              borderRadius: 10,
              background: branding.faviconUrl ? "transparent" : "var(--accent)",
              color: "var(--accent-fg)",
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {branding.faviconUrl ? (
              <img
                src={branding.faviconUrl}
                alt=""
                width={40}
                height={40}
                style={{ width: 40, height: 40, objectFit: "contain" }}
              />
            ) : (
              branding.siteTitle.charAt(0).toUpperCase() || "S"
            )}
          </div>
          {/* Plain <h1> instead of <CardTitle>: the global
              [data-slot=card-title] rule in index.css forces 12.5px
              !important on every CardTitle so list/editor headers
              stay uniform. We don't want that here — the auth card is
              the one place where a large title is the design intent. */}
          <h1
            className="tracking-tight text-foreground"
            style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}
          >
            {title}
          </h1>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          {children}
          {footer && <div className="mt-6 text-sm">{footer}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

const linkStyle: React.CSSProperties = { color: "var(--accent-strong)" };

function useAuthConfig(): AdminAuthConfig | null {
  const [cfg, setCfg] = useState<AdminAuthConfig | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAdminAuthConfig()
      .then((c) => {
        if (!cancelled) setCfg(c);
      })
      .catch(() => {
        if (!cancelled) setCfg({ allow_registration: false, password_reset_enabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return cfg;
}

export default function LoginPage() {
  const { login } = useAuth();
  const branding = useBranding();
  const cfg = useAuthConfig();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sign-up fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await adminRegister({
        full_name: regName,
        email: regEmail,
        password: regPassword,
        password_confirm: regConfirm,
      });
      if (result.sign_in) {
        // Backend already set the session cookie. Pull the user record so
        // the SPA's auth context updates without a full reload.
        await login(regEmail, regPassword).catch(() => {
          window.location.href = "/admin/dashboard";
        });
      } else {
        toast.success("Account created. Please sign in.");
        setMode("signin");
        setEmail(regEmail);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // Server-driven gating: the "Create account" toggle only appears when
  // site_settings.allow_registration is enabled. Forging the toggle in
  // the DOM changes nothing — the POST endpoint enforces the same flag.
  const showSignupToggle = cfg?.allow_registration === true;
  const showForgot = cfg?.password_reset_enabled === true;

  if (mode === "signup" && showSignupToggle) {
    return (
      <AuthShell
        branding={branding}
        title="Create your account"
        description={`Join ${branding.siteTitle}`}
        footer={
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="font-medium hover:underline"
            style={linkStyle}
          >
            Already have an account? Sign in
          </button>
        }
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <FieldRow label="Full name" id="reg-name" autoComplete="name" value={regName} onChange={setRegName} />
          <FieldRow label="Email" id="reg-email" type="email" autoComplete="email" value={regEmail} onChange={setRegEmail} />
          <FieldRow label="Password" id="reg-password" type="password" autoComplete="new-password" value={regPassword} onChange={setRegPassword} />
          <FieldRow label="Confirm password" id="reg-confirm" type="password" autoComplete="new-password" value={regConfirm} onChange={setRegConfirm} />
          <Button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-semibold shadow-sm" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      branding={branding}
      title={branding.siteTitle}
      description="Sign in to your account"
      footer={
        <div className="flex items-center justify-between">
          {showSignupToggle ? (
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-medium hover:underline"
              style={linkStyle}
            >
              Create account
            </button>
          ) : (
            <span />
          )}
          {showForgot && (
            <Link to="/admin/forgot-password" className="font-medium hover:underline" style={linkStyle}>
              Forgot password?
            </Link>
          )}
        </div>
      }
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        <FieldRow label="Email" id="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <FieldRow label="Password" id="password" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        <Button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-semibold shadow-sm" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

function FieldRow({
  label,
  id,
  type = "text",
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  id: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 text-sm"
      />
    </div>
  );
}

export function ForgotPasswordPage() {
  const branding = useBranding();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminForgotPassword(email);
      toast.success(res.message);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      branding={branding}
      title="Reset your password"
      description="We'll email you a link to set a new one"
      footer={
        <Link to="/admin/login" className="font-medium hover:underline" style={linkStyle}>
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">
          If an account exists with that email, a reset link has been sent. Check your inbox and
          follow the instructions.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldRow label="Email" id="forgot-email" type="email" autoComplete="email" value={email} onChange={setEmail} />
          <Button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-semibold shadow-sm" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const branding = useBranding();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminResetPassword({ token, password, password_confirm: confirm });
      toast.success(res.message);
      navigate("/admin/login", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        branding={branding}
        title="Invalid reset link"
        description="This link is missing its token"
        footer={
          <Link to="/admin/forgot-password" className="font-medium hover:underline" style={linkStyle}>
            Request a new reset link
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          The reset link you opened is incomplete. Please request a new one.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      branding={branding}
      title="Set a new password"
      description="Choose a strong password you haven't used here before"
      footer={
        <Link to="/admin/login" className="font-medium hover:underline" style={linkStyle}>
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldRow label="New password" id="new-password" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        <FieldRow label="Confirm new password" id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        <Button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-semibold shadow-sm" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
