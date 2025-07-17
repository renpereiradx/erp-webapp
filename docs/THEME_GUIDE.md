# Theme System Quick Start Guide

## Getting Started

The ERP application now features a complete multi-theme system. Here's how to use it:

### 1. Accessing Theme Settings

1. **Login to the application**:
   - Use demo credentials: `demo@erp.com` / `demo123`
   - Or any valid username/password

2. **Navigate to Settings**:
   - Click the "Settings" option in the sidebar
   - Or go directly to `/settings`

3. **Change Theme**:
   - Find the "Theme Selection" section
   - Choose from 6 available theme variants:
     - **Neo-Brutalism Light** (default)
     - **Neo-Brutalism Dark**
     - **Material Light**
     - **Material Dark**
     - **Fluent Light**
     - **Fluent Dark**

### 2. Theme Differences

#### Neo-Brutalism Theme
- **Visual Style**: Bold, angular, high-contrast design
- **Colors**: Vibrant lime, blue, orange, purple accents
- **Typography**: Heavy fonts, uppercase text, wide letter spacing
- **Shadows**: Large, pronounced drop shadows
- **Borders**: Thick borders, sharp corners

#### Material Design Theme
- **Visual Style**: Clean, elevated, layered interface
- **Colors**: Harmonious blue-based palette
- **Typography**: Clean, readable fonts
- **Shadows**: Subtle elevation shadows
- **Borders**: Rounded corners, thin borders

#### Fluent Design Theme
- **Visual Style**: Modern, translucent, flowing design
- **Colors**: Microsoft-inspired color system
- **Typography**: System fonts, balanced hierarchy
- **Shadows**: Depth-aware shadows
- **Borders**: Medium rounded corners

### 3. Testing Theme Changes

After selecting a theme, you'll see immediate changes in:

- **Navigation bar** colors and styling
- **Sidebar** appearance and visibility
- **Cards and buttons** throughout the app
- **Form inputs** and interactive elements
- **Charts and graphs** colors and borders
- **Typography** weights and spacing

### 4. Theme Persistence

- Your theme choice is automatically saved
- The theme will persist across browser sessions
- Each browser/device can have its own theme setting

## Development Usage

### Using Themes in Components

```jsx
import { useTheme } from 'next-themes';

const MyComponent = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');
  
  return (
    <div className={`p-4 ${
      isNeoBrutalism 
        ? 'border-4 border-foreground shadow-neo-brutal bg-card'
        : 'border border-border rounded-lg shadow-lg bg-card'
    }`}>
      <h2 className={`text-foreground ${
        isNeoBrutalism 
          ? 'font-black uppercase tracking-wide'
          : 'font-bold'
      }`}>
        My Component
      </h2>
      <p className="text-muted-foreground">
        This component adapts to the current theme!
      </p>
    </div>
  );
};
```

### Available CSS Variables

Use these CSS variables in your styles:

```css
/* Layout colors */
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground

/* UI colors */
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground

/* Semantic colors */
--destructive
--destructive-foreground
--border
--input
--ring

/* Chart colors */
--chart-primary
--chart-secondary
--chart-success
--chart-warning
--chart-danger
--chart-accent
```

## Troubleshooting

### Theme Not Changing
1. Check browser console for JavaScript errors
2. Ensure you're on the Settings page (`/settings`)
3. Try refreshing the page after theme selection

### Visual Issues
1. Some components may take a moment to update
2. Hard refresh (Ctrl+F5) may help with cached styles
3. Check that you're using the latest version

### Performance
1. Theme switching should be instantaneous
2. If experiencing lag, check browser performance
3. Large pages may take slightly longer to update all elements

## Quick Demo Script

To quickly test all themes:

1. **Start with Neo-Brutalism Light** (default)
2. **Navigate to Dashboard** - notice bold, angular design
3. **Go to Settings** - switch to **Material Light**
4. **Return to Dashboard** - see softer, cleaner design
5. **Back to Settings** - try **Fluent Dark**
6. **Check Dashboard again** - modern dark theme
7. **Test other pages** (Clients, Products) to see consistency

## Best Practices

- **Test theme changes** on all major pages
- **Check both light and dark modes** of each theme
- **Verify mobile responsiveness** across themes
- **Ensure accessibility** standards are maintained
- **Report any visual inconsistencies** for fixes
