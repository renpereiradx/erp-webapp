# Multi-Theme System Documentation

## Overview

This ERP web application implements a comprehensive multi-theme system supporting **Neo-Brutalism**, **Material Design**, and **Fluent Design** themes, each with light and dark mode variants.

## Features

✅ **6 Theme Variants Total**
- Neo-Brutalism Light/Dark
- Material Design Light/Dark 
- Fluent Design Light/Dark

✅ **Dynamic Theme Switching**
- Real-time theme changes from Settings page
- Persistent theme selection using `next-themes`
- Global theme state management

✅ **CSS Variables Architecture**
- Scalable color system using CSS custom properties
- Theme-specific variable overrides
- Consistent styling across all components

✅ **Component Theme Awareness**
- Conditional styling based on active theme
- Theme-specific visual behaviors
- Responsive design patterns

## Theme Structure

### CSS Variables

All themes use the following CSS variable structure defined in `/src/App.css`:

```css
:root {
  /* Base variables */
  --background: /* theme-specific value */;
  --foreground: /* theme-specific value */;
  --card: /* theme-specific value */;
  --primary: /* theme-specific value */;
  /* ... more variables ... */
}
```

### Theme Variants

#### Neo-Brutalism
- **Visual Style**: Bold, angular, high-contrast
- **Typography**: Heavy fonts, uppercase text, wide tracking
- **Shadows**: Large, pronounced drop shadows (`shadow-neo-brutal`)
- **Borders**: Thick borders, sharp corners
- **Colors**: Vibrant accent colors

#### Material Design
- **Visual Style**: Soft, elevated, layered
- **Typography**: Clean, readable fonts
- **Shadows**: Subtle elevation shadows
- **Borders**: Rounded corners, thin borders
- **Colors**: Harmonious color palette

#### Fluent Design
- **Visual Style**: Modern, translucent, flowing
- **Typography**: System fonts, balanced hierarchy
- **Shadows**: Depth-aware shadows
- **Borders**: Medium rounded corners
- **Colors**: Microsoft-inspired color system

## Implementation Details

### Theme Provider Setup

The app is wrapped with `ThemeProvider` from `next-themes` in `/src/main.jsx`:

```jsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider
  attribute="class"
  defaultTheme="neo-brutalism-light"
  themes={[
    'neo-brutalism-light', 'neo-brutalism-dark',
    'material-light', 'material-dark',
    'fluent-light', 'fluent-dark'
  ]}
  enableSystem={false}
  storageKey="erp-theme"
>
  <App />
</ThemeProvider>
```

### Theme Detection

Components use the `useTheme` hook to detect the current theme:

```jsx
import { useTheme } from 'next-themes';

const MyComponent = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  
  return (
    <div className={`${
      isNeoBrutalism 
        ? 'border-4 border-foreground shadow-neo-brutal'
        : 'border border-border rounded-lg shadow-lg'
    }`}>
      {/* Component content */}
    </div>
  );
};
```

### Theme Switching

The `ThemeSwitcher` component provides the UI for theme selection:

```jsx
// Located in /src/components/ThemeSwitcher.jsx
// Integrated into Settings page (/src/pages/Settings.jsx)
```

## Component Theming

### Core Components

All major UI components have been updated to support themes:

- **Button** (`/src/components/ui/Button.jsx`)
- **Card** (`/src/components/ui/Card.jsx`)
- **Input** (`/src/components/ui/Input.jsx`)
- **Layout** (`/src/layouts/MainLayout.jsx`)

### Conditional Styling Pattern

Components use this pattern for theme-aware styling:

```jsx
<element className={`base-classes ${
  isNeoBrutalism 
    ? 'brutalist-specific-classes'
    : isMaterial 
      ? 'material-specific-classes'
      : 'fluent-specific-classes'
}`}>
```

### CSS Variable Usage

Components reference CSS variables instead of hardcoded colors:

```css
/* Instead of hardcoded colors */
.old-style {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #cccccc;
}

/* Use CSS variables */
.new-style {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

## File Structure

```
src/
├── App.css                     # Theme variables and global styles
├── main.jsx                    # ThemeProvider setup
├── components/
│   ├── ThemeSwitcher.jsx      # Theme selection component
│   └── ui/
│       ├── Button.jsx         # Theme-aware button
│       ├── Card.jsx           # Theme-aware cards
│       └── Input.jsx          # Theme-aware inputs
├── layouts/
│   └── MainLayout.jsx         # Theme-aware layout
└── pages/
    ├── Settings.jsx           # Theme switcher integration
    ├── Login.jsx              # Theme-aware login page
    └── Dashboard.jsx          # Theme-aware dashboard
```

## Development Guidelines

### Adding New Components

When creating new components, follow these guidelines:

1. **Import useTheme hook**:
   ```jsx
   import { useTheme } from 'next-themes';
   ```

2. **Detect current theme**:
   ```jsx
   const { theme } = useTheme();
   const isNeoBrutalism = theme?.includes('neo-brutalism');
   ```

3. **Use CSS variables**:
   ```jsx
   className="bg-card text-foreground border-border"
   ```

4. **Add conditional styling**:
   ```jsx
   className={`base-classes ${
     isNeoBrutalism ? 'brutalist-classes' : 'modern-classes'
   }`}
   ```

### Adding New Themes

To add a new theme:

1. **Define CSS variables** in `/src/App.css`:
   ```css
   [data-theme="new-theme-light"] {
     --background: /* light background */;
     --foreground: /* light foreground */;
     /* ... other variables ... */
   }
   
   [data-theme="new-theme-dark"] {
     --background: /* dark background */;
     --foreground: /* dark foreground */;
     /* ... other variables ... */
   }
   ```

2. **Update ThemeProvider themes array** in `/src/main.jsx`:
   ```jsx
   themes={[
     // ... existing themes ...
     'new-theme-light', 'new-theme-dark'
   ]}
   ```

3. **Update ThemeSwitcher** component to include new theme options.

## Testing

The theme system has been tested to ensure:

- ✅ All theme variants load correctly
- ✅ Theme switching works in real-time
- ✅ Theme persistence across browser sessions
- ✅ All components respond to theme changes
- ✅ Build process completes without errors
- ✅ No console errors or warnings

## Performance

The theme system is optimized for performance:

- CSS variables enable efficient theme switching
- No runtime style calculations
- Minimal JavaScript overhead
- Tailwind CSS for optimal bundle size

## Browser Support

The theme system supports all modern browsers that support:
- CSS Custom Properties (CSS Variables)
- ES6 modules
- Modern React features

## Troubleshooting

### Theme Not Applying
- Check that ThemeProvider is properly configured
- Verify CSS variables are defined for all themes
- Ensure components import and use `useTheme` hook

### Styling Issues
- Confirm CSS variables are used instead of hardcoded colors
- Check conditional styling logic in components
- Verify Tailwind classes are correctly applied

### Performance Issues
- Use CSS variables instead of inline styles
- Minimize theme detection calculations
- Cache theme-dependent values when possible
