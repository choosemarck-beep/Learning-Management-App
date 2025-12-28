/**
 * Quick Icon Generation Script
 * Generates all required PNG icon sizes from the SVG
 * 
 * Requirements: npm install sharp
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp package not found.');
  console.log('📦 Installing sharp...');
  console.log('   Run: npm install --save-dev sharp');
  console.log('   Then run this script again.');
  process.exit(1);
}

const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('❌ Error: icon.svg not found at', svgPath);
  process.exit(1);
}

// Icon sizes to generate
const iconSizes = [
  { size: 16, filename: 'icon-16x16.png' },
  { size: 32, filename: 'icon-32x32.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
  { size: 192, filename: 'icon-192x192.png' },
  { size: 512, filename: 'icon-512x512.png' },
];

console.log('🎨 Generating icons from SVG...\n');

// Generate each icon size
Promise.all(
  iconSizes.map(({ size, filename }) => {
    const outputPath = path.join(outputDir, filename);
    return sharp(svgPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✅ Generated ${filename} (${size}x${size})`);
        return { size, filename, success: true };
      })
      .catch((error) => {
        console.error(`❌ Error generating ${filename}:`, error.message);
        return { size, filename, success: false, error };
      });
  })
)
  .then((results) => {
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log('\n📊 Summary:');
    console.log(`   ✅ Success: ${successCount} icons`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} icons`);
    }

    if (successCount === iconSizes.length) {
      console.log('\n🎉 All icons generated successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Create favicon.ico from icon-16x16.png and icon-32x32.png');
      console.log('      Use: https://convertio.co/png-ico/ or https://www.icoconverter.com/');
      console.log('   2. Restart your dev server: npm run dev');
      console.log('   3. Hard refresh your browser (Ctrl+F5 / Cmd+Shift+R)');
    }
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

