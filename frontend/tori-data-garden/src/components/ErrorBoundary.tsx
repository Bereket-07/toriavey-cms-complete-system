import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Catches render-time errors in any child page and shows the actual error
 * message instead of a blank white screen. The surrounding layout (nav)
 * stays intact, so the user can navigate away.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Also log to console so the full stack is available in dev tools.

    console.error("[ErrorBoundary] A page crashed:", error, info);
    this.setState({ info });
  }

  reset = () => this.setState({ hasError: false, error: null, info: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">
              This page hit an error
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The rest of the app still works — use the navigation above. The
            details below show exactly what went wrong.
          </p>
          <pre className="text-xs bg-card border border-border rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap text-destructive">
            {error?.name}: {error?.message}
            {"\n\n"}
            {(error?.stack || "").split("\n").slice(0, 8).join("\n")}
            {info?.componentStack
              ? "\n\nComponent stack:" +
                info.componentStack.split("\n").slice(0, 8).join("\n")
              : ""}
          </pre>
          <div className="mt-4">
            <Button onClick={this.reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
