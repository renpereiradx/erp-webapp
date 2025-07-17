import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ThemeDebugPage = () => {
  const { theme, setTheme } = useTheme();
  const [cssVariables, setCssVariables] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCSSVariables = () => {
    if (typeof window !== 'undefined') {
      const rootStyle = getComputedStyle(document.documentElement);
      
      const variables = {
        // Base variables
        background: rootStyle.getPropertyValue('--background'),
        foreground: rootStyle.getPropertyValue('--foreground'),
        primary: rootStyle.getPropertyValue('--primary'),
        secondary: rootStyle.getPropertyValue('--secondary'),
        destructive: rootStyle.getPropertyValue('--destructive'),
        accent: rootStyle.getPropertyValue('--accent'),
        
        // Material Design variables
        mdPrimaryMain: rootStyle.getPropertyValue('--md-primary-main'),
        mdSecondaryMain: rootStyle.getPropertyValue('--md-secondary-main'),
        mdErrorMain: rootStyle.getPropertyValue('--md-error-main'),
        mdSurfaceMain: rootStyle.getPropertyValue('--md-surface-main'),
        
        // Fluent Design variables
        fluentBrandPrimary: rootStyle.getPropertyValue('--fluent-brand-primary'),
        fluentSemanticDanger: rootStyle.getPropertyValue('--fluent-semantic-danger'),
        fluentSurfacePrimary: rootStyle.getPropertyValue('--fluent-surface-primary'),
        
        // Neo-Brutalism variables
        brutalistRed: rootStyle.getPropertyValue('--brutalist-red'),
        brutalistGreen: rootStyle.getPropertyValue('--brutalist-green'),
      };
      
      setCssVariables(variables);
      console.log('CSS Variables Update:', variables);
    }
  };

  useEffect(() => {
    updateCSSVariables();
  }, [theme, mounted]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <h1 className="text-3xl font-bold mb-6">Theme Debug Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Theme: {theme}</h2>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={() => setTheme('material-light')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Material Light
          </button>
          <button 
            onClick={() => setTheme('material-dark')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Material Dark
          </button>
          <button 
            onClick={() => setTheme('fluent-light')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Fluent Light
          </button>
          <button 
            onClick={() => setTheme('fluent-dark')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Fluent Dark
          </button>
          <button 
            onClick={() => setTheme('neo-brutalism-light')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Neo-Brutalism Light
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Base Variables */}
        <div className="p-4 border rounded" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold mb-3">Base Variables</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(cssVariables).filter(([key]) => !key.startsWith('md') && !key.startsWith('fluent') && !key.startsWith('brutalist')).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>--{key.replace(/([A-Z])/g, '-$1').toLowerCase()}:</span>
                <span style={{ color: value || 'red' }}>{value || 'Not set'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Material Design Variables */}
        <div className="p-4 border rounded" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold mb-3">Material Design</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(cssVariables).filter(([key]) => key.startsWith('md')).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>--{key.replace(/([A-Z])/g, '-$1').toLowerCase().replace('md-', 'md-')}:</span>
                <span style={{ color: value || 'red' }}>{value || 'Not set'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fluent Design Variables */}
        <div className="p-4 border rounded" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold mb-3">Fluent Design</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(cssVariables).filter(([key]) => key.startsWith('fluent')).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>--{key.replace(/([A-Z])/g, '-$1').toLowerCase().replace('fluent-', 'fluent-')}:</span>
                <span style={{ color: value || 'red' }}>{value || 'Not set'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Neo-Brutalism Variables */}
        <div className="p-4 border rounded" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold mb-3">Neo-Brutalism</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(cssVariables).filter(([key]) => key.startsWith('brutalist')).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>--{key.replace(/([A-Z])/g, '-$1').toLowerCase().replace('brutalist-', 'brutalist-')}:</span>
                <span style={{ color: value || 'red' }}>{value || 'Not set'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Badge Tests</h3>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: 'var(--md-error-main, red)',
              color: 'var(--md-on-error, white)',
              padding: '2px 6px',
              borderRadius: '50%',
              fontSize: '12px',
              minWidth: '20px',
              textAlign: 'center'
            }}>3</span>
          </div>
          
          <div className="relative">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: 'var(--fluent-semantic-danger, blue)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '50%',
              fontSize: '12px',
              minWidth: '20px',
              textAlign: 'center'
            }}>5</span>
          </div>
          
          <div className="relative">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: 'var(--brutalist-red, green)',
              color: 'black',
              padding: '2px 6px',
              border: '2px solid black',
              fontSize: '12px',
              minWidth: '20px',
              textAlign: 'center'
            }}>7</span>
          </div>
        </div>
      </div>

      <button 
        onClick={updateCSSVariables}
        className="mt-6 px-4 py-2 rounded"
        style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
      >
        Refresh Variables
      </button>
    </div>
  );
};

export default ThemeDebugPage;
