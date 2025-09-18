import { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'development') {
      // Development only - error already logged by React
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md shadow-xl animate-fadeIn">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    Error details (Development only)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.handleReset}
                  className="transition-all hover:scale-105"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Refresh Page
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="transition-all hover:scale-105"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}