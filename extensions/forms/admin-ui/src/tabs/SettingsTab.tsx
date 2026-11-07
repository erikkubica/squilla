import React from "react";

const {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} = (window as any).__SQUILLA_SHARED__.ui;

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="fm-sec">
      <div className="fm-sec-head">
        <div>
          <h3>{title}</h3>
          {intro && <p>{intro}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsTab({ form, setForm }: any) {
  const settings = form.settings || {};

  const getSetting = (key: string, defaultValue: any) =>
    settings[key] !== undefined ? settings[key] : defaultValue;

  const updateSettings = (key: string, value: any) => {
    setForm({ ...form, settings: { ...form.settings, [key]: value } });
  };

  const captchaProvider = getSetting("captcha_provider", "none");

  return (
    <div className="fm-ed" style={{ maxWidth: 760 }}>
      <Section title="After sending" intro="What people see once they press the button.">
        <div className="fm-grid2">
          <div className="fm-field">
            <Label htmlFor="fm-success">Success message</Label>
            <Input
              id="fm-success"
              value={getSetting("success_message", "")}
              onChange={(e: any) => updateSettings("success_message", e.target.value)}
              placeholder="Thank you for your submission!"
            />
          </div>
          <div className="fm-field">
            <Label htmlFor="fm-error">Error message</Label>
            <Input
              id="fm-error"
              value={getSetting("error_message", "")}
              onChange={(e: any) => updateSettings("error_message", e.target.value)}
              placeholder="There was an error processing your request."
            />
          </div>
        </div>
        <div className="fm-field">
          <Label htmlFor="fm-redirect">Redirect to</Label>
          <Input
            id="fm-redirect"
            value={getSetting("redirect_url", "")}
            onChange={(e: any) => updateSettings("redirect_url", e.target.value)}
            placeholder="e.g. /thank-you"
          />
          <p className="fm-hint">Leave empty to stay on the same page and show the success message.</p>
        </div>
      </Section>

      <Section title="Spam protection">
        <div className="fm-switch-row">
          <div>
            <Label htmlFor="fm-honeypot">Honeypot field</Label>
            <p className="fm-hint">A hidden field that bots fill in and people never see.</p>
          </div>
          <Switch
            id="fm-honeypot"
            checked={getSetting("honeypot_enabled", true)}
            onCheckedChange={(checked: boolean) => updateSettings("honeypot_enabled", checked)}
          />
        </div>
        <div className="fm-grid2">
          <div className="fm-field">
            <Label htmlFor="fm-rate">Submissions per IP</Label>
            <Input
              id="fm-rate"
              type="number"
              inputMode="numeric"
              min={1}
              value={getSetting("rate_limit", 10)}
              onChange={(e: any) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) updateSettings("rate_limit", val);
              }}
              placeholder="10"
            />
          </div>
          <div className="fm-field">
            <Label htmlFor="fm-window">Within (seconds)</Label>
            <Input
              id="fm-window"
              type="number"
              inputMode="numeric"
              min={1}
              value={getSetting("rate_limit_window", 3600)}
              onChange={(e: any) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) updateSettings("rate_limit_window", val);
              }}
              placeholder="3600"
            />
            <p className="fm-hint">3600 is one hour.</p>
          </div>
        </div>
        <div className="fm-field">
          <Label>CAPTCHA</Label>
          <Select value={captchaProvider} onValueChange={(val: string) => updateSettings("captcha_provider", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="recaptcha">reCAPTCHA v3</SelectItem>
              <SelectItem value="hcaptcha">hCaptcha</SelectItem>
              <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {captchaProvider !== "none" && (
          <div className="fm-grid2 fm-indent">
            <div className="fm-field">
              <Label htmlFor="fm-cap-site">Site key</Label>
              <Input
                id="fm-cap-site"
                value={getSetting("captcha_site_key", "")}
                onChange={(e: any) => updateSettings("captcha_site_key", e.target.value)}
                placeholder="Enter your site key"
              />
            </div>
            <div className="fm-field">
              <Label htmlFor="fm-cap-secret">Secret key</Label>
              <Input
                id="fm-cap-secret"
                type="password"
                value={getSetting("captcha_secret_key", "")}
                onChange={(e: any) => updateSettings("captcha_secret_key", e.target.value)}
                placeholder="Enter your secret key"
              />
            </div>
          </div>
        )}
      </Section>

      <Section title="Privacy and data">
        <div className="fm-grid2">
          <div className="fm-field">
            <Label htmlFor="fm-privacy">Privacy policy URL</Label>
            <Input
              id="fm-privacy"
              value={getSetting("privacy_policy_url", "")}
              onChange={(e: any) => updateSettings("privacy_policy_url", e.target.value)}
              placeholder="e.g. /privacy-policy"
            />
            <p className="fm-hint">Linked from consent checkboxes.</p>
          </div>
          <div className="fm-field">
            <Label>Keep submissions for</Label>
            <Select
              value={String(getSetting("retention_period", "0"))}
              onValueChange={(val: string) => updateSettings("retention_period", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Forever</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="fm-hint">Older submissions are deleted automatically.</p>
          </div>
        </div>
        <div className="fm-switch-row">
          <div>
            <Label htmlFor="fm-store-ip">Store IP addresses</Label>
            <p className="fm-hint">Turn off for strict GDPR compliance.</p>
          </div>
          <Switch
            id="fm-store-ip"
            checked={getSetting("store_ip", true)}
            onCheckedChange={(checked: boolean) => updateSettings("store_ip", checked)}
          />
        </div>
      </Section>

      <Section title="Styling">
        <div className="fm-field">
          <Label htmlFor="fm-css">CSS class on the form</Label>
          <Input
            id="fm-css"
            value={getSetting("form_css_class", "")}
            onChange={(e: any) => updateSettings("form_css_class", e.target.value)}
            placeholder="e.g. my-newsletter dark-form"
            className="font-mono"
          />
        </div>
      </Section>
    </div>
  );
}
