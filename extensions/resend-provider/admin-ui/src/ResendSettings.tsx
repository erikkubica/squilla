import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@squilla/ui";
import { Input, Label, Button } from "@squilla/ui";
import { toast } from "sonner";
import { getExtensionSettings, updateExtensionSettings } from "@squilla/api";
import { Loader2, Key } from "@squilla/icons";

const SLUG = "resend-provider";

export default function ResendSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  useEffect(() => {
    getExtensionSettings(SLUG)
      .then((data: Record<string, string>) => {
        setApiKey(data.api_key || "");
        setFromEmail(data.from_email || "");
        setFromName(data.from_name || "");
      })
      .catch(() => toast.error("Failed to load Resend settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateExtensionSettings(SLUG, {
        api_key: apiKey,
        from_email: fromEmail,
        from_name: fromName,
      });
      toast.success("Resend settings saved");
    } catch {
      toast.error("Failed to save Resend settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-foreground" />
          <CardTitle className="text-lg font-semibold text-foreground">
            Resend Configuration
          </CardTitle>
        </div>
        <CardDescription>
          Configure your Resend.com API key for sending transactional emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">API Key</Label>
          <Input
            type="password"
            placeholder="re_..."
            value={apiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">From Email</Label>
            <Input
              placeholder="noreply@example.com"
              value={fromEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">From Name</Label>
            <Input
              placeholder="My Site"
              value={fromName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromName(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Resend Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
