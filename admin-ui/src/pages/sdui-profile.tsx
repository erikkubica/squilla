import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SduiAdminShell } from "../sdui/admin-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SidebarCard } from "@/components/ui/sidebar-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { usePageMeta } from "@/components/layout/page-meta";
import { ApiClientError, changeMyPassword, updateMe } from "@/api/client";

type FieldErrors = Record<string, string>;

const MIN_PASSWORD_LENGTH = 8;

function errorFields(err: unknown): FieldErrors {
  return err instanceof ApiClientError && err.fields ? err.fields : {};
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) {
    // Validation errors carry a generic message; the first field message is
    // what the user actually needs to read.
    const first = err.fields && Object.values(err.fields)[0];
    return first || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs" style={{ color: "var(--danger)" }}>
      {message}
    </p>
  );
}

function AccountSection() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Sync when the user record changes elsewhere (SSE refresh) and the form is clean.
  const savedName = user?.full_name ?? "";
  const savedEmail = user?.email ?? "";
  const dirty = fullName.trim() !== savedName || email.trim() !== savedEmail;

  useEffect(() => {
    if (!saving) {
      setFullName(savedName);
      setEmail(savedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedName, savedEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const fresh = await updateMe({ full_name: fullName.trim(), email: email.trim() });
      await refreshUser(fresh);
      toast.success("Profile saved");
    } catch (err) {
      setErrors(errorFields(err));
      toast.error(errorMessage(err, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SidebarCard title="Account" icon={<UserRound size={15} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-fullname">Full name</Label>
            <Input
              id="profile-fullname"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!errors.full_name}
              aria-describedby={errors.full_name ? "profile-fullname-error" : undefined}
              maxLength={100}
            />
            <FieldError id="profile-fullname-error" message={errors.full_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "profile-email-error" : undefined}
              required
            />
            <FieldError id="profile-email-error" message={errors.email} />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={saving || !dirty}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </SidebarCard>
    </form>
  );
}

function PasswordSection() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v: FieldErrors = {};
    if (!current) v.current_password = "Current password is required";
    if (next.length < MIN_PASSWORD_LENGTH) {
      v.new_password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    } else if (next !== confirm) {
      v.password_confirm = "Passwords do not match";
    }
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      await changeMyPassword({
        current_password: current,
        new_password: next,
        password_confirm: confirm,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password changed. Other sessions were signed out.");
    } catch (err) {
      setErrors(errorFields(err));
      toast.error(errorMessage(err, "Failed to change password"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SidebarCard title="Change password" icon={<KeyRound size={15} />}>
        {/* Hidden username helps password managers pair the new password with the account. */}
        <input type="text" name="username" autoComplete="username" value={user?.email ?? ""} hidden readOnly />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <Label htmlFor="profile-current-password">Current password</Label>
            <Input
              id="profile-current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              aria-invalid={!!errors.current_password}
              aria-describedby={errors.current_password ? "profile-current-password-error" : undefined}
            />
            <FieldError id="profile-current-password-error" message={errors.current_password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-new-password">New password</Label>
            <Input
              id="profile-new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              aria-invalid={!!errors.new_password}
              aria-describedby="profile-new-password-hint"
            />
            {errors.new_password ? (
              <FieldError id="profile-new-password-hint" message={errors.new_password} />
            ) : (
              <p id="profile-new-password-hint" className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-confirm-password">Confirm new password</Label>
            <Input
              id="profile-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!errors.password_confirm}
              aria-describedby={errors.password_confirm ? "profile-confirm-password-error" : undefined}
            />
            <FieldError id="profile-confirm-password-error" message={errors.password_confirm} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            Changing your password signs you out on every other device.
          </p>
          <Button type="submit" disabled={saving || !current || !next || !confirm}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Changing…" : "Change password"}
          </Button>
        </div>
      </SidebarCard>
    </form>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  usePageMeta(["My Profile"]);
  const roleName =
    user?.role_name || (typeof user?.role === "object" ? user.role.name : user?.role) || "";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }} className="space-y-4">
      <PageHeader title="My profile" subtitle={roleName ? `Signed in as ${roleName}` : undefined} />
      <AccountSection />
      <PasswordSection />
    </div>
  );
}

export function SduiProfilePage() {
  return (
    <SduiAdminShell>
      <ProfilePage />
    </SduiAdminShell>
  );
}
