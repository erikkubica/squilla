import { useState } from "react";
import { Settings, Send, Loader2, Puzzle } from "@vibecms/icons";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@vibecms/ui";
import { toast } from "sonner";
import { sendTestEmail } from "@vibecms/api";

export default function EmailSettings() {
  const [testing, setTesting] = useState(false);

  async function handleTestEmail() {
    setTesting(true);
    try {
      await sendTestEmail();
      toast.success("Test email sent successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send test email";
      toast.error(message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Email Settings</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleTestEmail}
          disabled={testing}
          className="rounded-lg border-slate-300"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
      </div>

      {/* Provider info card */}
      <Card className="rounded-xl border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Email Provider
          </CardTitle>
          <CardDescription>
            Configure your email provider via the provider-specific extension (SMTP or Resend).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-slate-400">
          <Puzzle className="h-12 w-12" />
          <p className="text-sm text-center max-w-md">
            Go to <strong>Extensions</strong> and activate an email provider
            (SMTP or Resend) to configure email delivery settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
