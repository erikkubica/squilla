import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@vibecms/ui";
import { Input, Label, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vibecms/ui";
import { toast } from "sonner";
import { getExtensionSettings, updateExtensionSettings } from "@vibecms/api";
import { Loader2, Server } from "@vibecms/icons";

const SLUG = "smtp-provider";

export default function SmtpSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [encryption, setEncryption] = useState("tls");

  useEffect(() => {
    getExtensionSettings(SLUG)
      .then((data: Record<string, string>) => {
        setHost(data.host || "");
        setPort(data.port || "587");
        setUsername(data.username || "");
        setPassword(data.password || "");
        setFromEmail(data.from_email || "");
        setFromName(data.from_name || "");
        setEncryption(data.encryption || "tls");
      })
      .catch(() => toast.error("Failed to load SMTP settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateExtensionSettings(SLUG, {
        host,
        port,
        username,
        password,
        from_email: fromEmail,
        from_name: fromName,
        encryption,
      });
      toast.success("SMTP settings saved");
    } catch {
      toast.error("Failed to save SMTP settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-lg font-semibold text-slate-900">
            SMTP Configuration
          </CardTitle>
        </div>
        <CardDescription>
          Configure your SMTP server for sending transactional emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Host</Label>
            <Input placeholder="smtp.example.com" value={host} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHost(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Port</Label>
            <Input placeholder="587" value={port} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPort(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Username</Label>
            <Input placeholder="user@example.com" value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Password</Label>
            <Input type="password" placeholder="********" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">From Email</Label>
            <Input placeholder="noreply@example.com" value={fromEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">From Name</Label>
            <Input placeholder="My Site" value={fromName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2 max-w-xs">
          <Label className="text-sm font-medium text-slate-700">Encryption</Label>
          <Select value={encryption} onValueChange={setEncryption}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tls">TLS</SelectItem>
              <SelectItem value="starttls">STARTTLS</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save SMTP Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
