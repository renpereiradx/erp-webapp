import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <h1 className="text-3xl font-black uppercase tracking-wide">Algo salió mal</h1>
          <p className="text-lg font-bold text-gray-600 uppercase tracking-wide">
            Por favor, recarga la página o contacta al soporte técnico.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
