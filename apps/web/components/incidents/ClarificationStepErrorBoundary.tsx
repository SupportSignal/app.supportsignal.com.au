"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@starter/ui/card";
import { Button } from "@starter/ui/button";
import { Alert, AlertDescription } from "@starter/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ClarificationStepErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 ClarificationStep Error Boundary caught an error:", error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    console.log("🔄 Resetting ClarificationStep error boundary");
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    console.log("🔄 Reloading page due to error boundary");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Clarification Step Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The clarification questions component encountered an error and stopped working.
                This might be due to a network issue or system problem.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Error:</strong> {this.state.error?.message || "Unknown error"}
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="default" size="sm">
                Reload Page
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              <p>If this problem persists, please:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Refresh your browser</li>
                <li>Check your internet connection</li>
                <li>Try again in a few minutes</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}