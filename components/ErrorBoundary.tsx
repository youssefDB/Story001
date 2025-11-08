import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  log: (message: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.log(`ERROR BOUNDARY CAUGHT: ${error.toString()}`);
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 text-center">
          <h1 className="text-3xl font-title text-red-600 mb-4">حدث خطأ فادح</h1>
          <p className="text-xl max-w-md mb-4">
            عذراً، حدث خطأ غير متوقع أدى إلى توقف التطبيق.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            قد يكون هذا بسبب مشكلة في الاتصال أو خطأ في تهيئة التطبيق. يرجى محاولة تحديث الصفحة.
          </p>
          {this.state.error && (
            <pre className="text-left text-xs bg-gray-800 p-2 rounded overflow-auto max-w-full">
                <code>{this.state.error.toString()}</code>
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
