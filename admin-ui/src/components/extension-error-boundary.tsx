import { Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  extensionName?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ExtensionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(
      `[extensions] Error in ${this.props.extensionName || "extension"}:`,
      error,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="rounded-xl" style={{ borderColor: "var(--danger-border)", background: "var(--danger-bg)" }}>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--danger)" }} />
            <h3 className="font-medium" style={{ color: "var(--danger)" }}>Extension Error</h3>
            <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
              {this.props.extensionName
                ? `"${this.props.extensionName}" encountered an error.`
                : "This extension encountered an error."}
            </p>
            <p className="text-xs mt-1 font-mono" style={{ color: "var(--danger)" }}>
              {this.state.error?.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
