# Icon Generation Instructions

This document provides instructions for generating all required icon sizes from the base SVG design.

## Base Files

- `public/icon.svg` - Base galaxy icon design (512x512)
- `public/safari-pinned-tab.svg` - Monochrome version for Safari pinned tabs

## Required Icon Sizes

You need to generate the following PNG files from `icon.svg`:

1. `icon-16x16.png` - Browser tab (small)
2. `icon-32x32.png` - Browser tab (standard)
3. `icon-192x192.png` - Android home screen (PWA minimum)
4. `icon-512x512.png` - Android splash screen, PWA install (recommended)
5. `apple-touch-icon.png` - 180x180 for iOS home screen
6. `favicon.ico` - Multi-size ICO file (16x16, 32x32)

## Method 1: Online Tools (Easiest)

### For PNG Generation:
1. Visit https://realfavicongenerator.net/
2. Upload `public/icon.svg`
3. Configure settings:
   - Android Chrome: 192x192 and 512x512
   - iOS: 180x180
   - Favicon: 16x16 and 32x32
4. Download generated files
5. Place all files in `public/` folder

### Alternative: https://favicon.io/
1. Upload `icon.svg`
2. Generate all sizes
3. Download and extract to `public/` folder

## Method 2: ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Generate PNG sizes
convert public/icon.svg -resize 16x16 public/icon-16x16.png
convert public/icon.svg -resize 32x32 public/icon-32x32.png
convert public/icon.svg -resize 192x192 public/icon-192x192.png
convert public/icon.svg -resize 512x512 public/icon-512x512.png
convert public/icon.svg -resize 180x180 public/apple-touch-icon.png

# Create multi-size ICO file
convert public/icon-16x16.png public/icon-32x32.png public/favicon.ico
```

## Method 3: Design Software

### Using Figma/Adobe Illustrator:
1. Open `icon.svg` in your design software
2. Export at each required size:
   - 16x16px → `icon-16x16.png`
   - 32x32px → `icon-32x32.png`
   - 192x192px → `icon-192x192.png`
   - 512x512px → `icon-512x512.png`
   - 180x180px → `apple-touch-icon.png`
3. Use an ICO converter (online tool) to create `favicon.ico` from 16x16 and 32x32 PNGs

## Method 4: Node.js Script (Automated)

Create a script using `sharp` or `svgexport`:

```bash
npm install --save-dev sharp
```

Then create `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 192, 512, 180];
const svgPath = 'public/icon.svg';

sizes.forEach(size => {
  const filename = size === 180 
    ? 'public/apple-touch-icon.png'
    : `public/icon-${size}x${size}.png`;
  
  sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(filename)
    .then(() => console.log(`Generated ${filename}`))
    .catch(err => console.error(`Error generating ${filename}:`, err));
});
```

Run: `node scripts/generate-icons.js`

## Creating favicon.ico

After generating PNG files, create the ICO file:

1. Use https://convertio.co/png-ico/ or https://www.icoconverter.com/
2. Upload both `icon-16x16.png` and `icon-32x32.png`
3. Select "Multi-size ICO"
4. Download and save as `public/favicon.ico`

## Verification Checklist

After generating all files, verify:

- [ ] `public/favicon.ico` exists (multi-size ICO)
- [ ] `public/icon-16x16.png` exists
- [ ] `public/icon-32x32.png` exists
- [ ] `public/icon-192x192.png` exists
- [ ] `public/icon-512x512.png` exists
- [ ] `public/apple-touch-icon.png` exists (180x180)
- [ ] All files are in `public/` folder
- [ ] All PNG files are actual PNG format
- [ ] ICO file opens correctly in image viewer

## Testing

After placing files in `public/` folder:

1. Restart development server: `npm run dev`
2. Check browser tab - favicon should appear
3. Test on mobile:
   - Android: Add to home screen, verify icon appears
   - iOS: Add to home screen, verify icon appears
4. Test PWA install - icon should appear in install prompt

## Notes

- All icons should maintain the galaxy/spiral design
- Colors should match Pixel Galaxy theme
- Icons should be recognizable at small sizes (16x16)
- Use high-quality rendering for best results

