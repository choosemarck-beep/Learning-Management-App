# AnimatedProgressBar Component

A reusable animated progress bar component extracted from the Learning Management Logo. Can be used as a loading indicator or progress indicator throughout the app.

## Usage

### As a Loading Indicator (Indeterminate)

```tsx
import { AnimatedProgressBar } from "@/components/ui";

// Simple loading indicator
<AnimatedProgressBar />

// Small size without arrow
<AnimatedProgressBar size="sm" showArrow={false} />
```

### As a Progress Indicator (Determinate)

```tsx
import { AnimatedProgressBar } from "@/components/ui";

// Show 75% progress
<AnimatedProgressBar progress={75} />

// Large size with custom max width
<AnimatedProgressBar 
  progress={50} 
  size="lg" 
  maxWidth="400px" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` | `undefined` | Progress value (0-100). If undefined, shows as indeterminate/loading animation. |
| `segments` | `number` | `20` | Number of segments in the progress bar. |
| `showArrow` | `boolean` | `true` | Show arrow at the end of the progress bar. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant of the progress bar. |
| `className` | `string` | `undefined` | Custom className for the container. |
| `maxWidth` | `string` | `undefined` | Custom max-width for the progress bar. |

## Examples

### Loading States

```tsx
// In a button while submitting
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <AnimatedProgressBar size="sm" showArrow={false} />
      Submitting...
    </>
  ) : (
    "Submit"
  )}
</Button>

// In a modal while loading data
{isLoading && (
  <div className={styles.loadingContainer}>
    <AnimatedProgressBar />
    <p>Loading...</p>
  </div>
)}
```

### Progress States

```tsx
// File upload progress
<AnimatedProgressBar progress={uploadProgress} />

// Course completion progress
<AnimatedProgressBar progress={courseProgress} size="lg" />
```

## Features

- ✅ Animated pulsing glow effect
- ✅ Staggered wave animation for visual appeal
- ✅ Purple gradient matching the app theme
- ✅ Accessible (ARIA attributes)
- ✅ Responsive and mobile-first
- ✅ Flexible sizing options
- ✅ Works as both loading and progress indicator

