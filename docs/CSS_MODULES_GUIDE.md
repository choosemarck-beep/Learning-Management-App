# CSS Modules Guide

This project uses **CSS Modules** for styling instead of Tailwind CSS. CSS Modules provide scoped, component-level styles with full CSS power.

## How CSS Modules Work

CSS Modules automatically scope class names to prevent conflicts. Each component gets its own stylesheet.

### Basic Usage

**Component.tsx:**
```tsx
import styles from './Component.module.css';

export function Component() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello</h1>
    </div>
  );
}
```

**Component.module.css:**
```css
.container {
  padding: var(--spacing-md);
  background-color: var(--color-bg-dark-secondary);
}

.title {
  font-size: 2rem;
  color: var(--color-text-primary);
}
```

## CSS Variables (Design System)

All design system values are available as CSS variables in `globals.css`:

### Colors
```css
var(--color-primary-teal)
var(--color-primary-blue)
var(--color-accent-gold)
var(--color-bg-dark)
var(--color-text-primary)
/* ... see globals.css for full list */
```

### Spacing
```css
var(--spacing-xs)   /* 8px */
var(--spacing-sm)   /* 12px */
var(--spacing-md)   /* 16px */
var(--spacing-lg)   /* 24px */
var(--spacing-xl)   /* 32px */
```

### Other Variables
```css
var(--radius-lg)        /* Border radius */
var(--transition-normal) /* Transitions */
var(--touch-target-min)  /* 44px */
```

## Best Practices

### 1. Use CSS Variables
Always use CSS variables from the design system:
```css
/* ✅ Good */
.button {
  background-color: var(--color-primary-teal);
  padding: var(--spacing-md);
}

/* ❌ Bad - hardcoded values */
.button {
  background-color: #0ea5e9;
  padding: 16px;
}
```

### 2. Component-Scoped Styles
Keep styles in component-specific `.module.css` files:
```
/components
  /ui
    Button.tsx
    Button.module.css  ← Component styles here
```

### 3. Global Styles
Only use global styles in `globals.css` for:
- CSS variables
- Base element styles (body, html)
- Utility classes
- Animations

### 4. Combining Classes
Use the `cn()` utility for combining classes:
```tsx
import { cn } from '@/lib/utils/cn';
import styles from './Component.module.css';

<div className={cn(styles.container, isActive && styles.active)}>
```

### 5. Responsive Design
Use standard CSS media queries:
```css
.container {
  padding: var(--spacing-md);
}

@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
  }
}
```

## Example Component

**Button.tsx:**
```tsx
import { cn } from '@/lib/utils/cn';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn(styles.button, styles[variant])}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Button.module.css:**
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal) ease;
  min-height: var(--touch-target-min);
}

.button:active {
  transform: scale(0.95);
}

.primary {
  background-color: var(--color-primary-teal);
  color: var(--color-text-primary);
}

.primary:hover {
  background-color: var(--color-primary-blue);
}

.secondary {
  background-color: var(--color-accent-gold);
  color: var(--color-text-primary);
}

.secondary:hover {
  background-color: var(--color-accent-gold-dark);
}
```

## Advantages of CSS Modules

1. **Scoped Styles** - No class name conflicts
2. **Full CSS Power** - Use all CSS features
3. **Type Safety** - TypeScript autocomplete for class names
4. **No Runtime Overhead** - Styles are compiled at build time
5. **Familiar Syntax** - Standard CSS, no learning curve
6. **Component Co-location** - Styles live next to components

## Migration from Tailwind

If you're used to Tailwind, here's the equivalent:

| Tailwind | CSS Modules |
|----------|-------------|
| `className="p-4"` | `className={styles.container}` + `padding: var(--spacing-md);` |
| `className="bg-blue-500"` | `background-color: var(--color-primary-teal);` |
| `className="flex items-center"` | `display: flex; align-items: center;` |
| `className="hover:bg-blue-600"` | `.button:hover { background-color: ... }` |

## Resources

- [CSS Modules Documentation](https://github.com/css-modules/css-modules)
- [Next.js CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules)
- See `app/globals.css` for all available CSS variables

