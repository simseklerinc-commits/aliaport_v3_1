/**
 * build-svg-sprite.js
 * Basit SVG sprite jeneratörü: `src/assets/icons/*.svg` dosyalarını okuyup
 * `public/icons-sprite.svg` içinde <symbol id="icon-[name]"> olarak birleştirir.
 * Build öncesi tek HTTP isteğiyle ikon kullanımını optimize eder.
 */
const fs = require('fs');
const path = require('path');

const iconsDir = path.resolve(__dirname, '../src/assets/icons');
const outFile = path.resolve(__dirname, '../public/icons-sprite.svg');

function toSymbol(svgContent, fileName) {
  // File name (without .svg)
  const name = path.basename(fileName, '.svg');
  // Remove outer <svg ...> wrapper, keep inner nodes
  const cleaned = svgContent
    .replace(/<\/?svg[^>]*>/g, '')
    .replace(/\r?\n/g, '\n')
    .trim();
  return `<symbol id="icon-${name}" viewBox="0 0 24 24">${cleaned}</symbol>`;
}

function buildSprite() {
  if (!fs.existsSync(iconsDir)) {
    console.error('Icons directory bulunamadı:', iconsDir);
    process.exit(1);
  }
  const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'));
  if (files.length === 0) {
    console.warn('İkon bulunamadı, sprite oluşturulmadı.');
    return;
  }
  const symbols = files.map(f => {
    const full = path.join(iconsDir, f);
    const content = fs.readFileSync(full, 'utf-8');
    return toSymbol(content, f);
  });
  const spriteContent = `<!-- Generated ${new Date().toISOString()} -->\n<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>`;
  // Ensure public dir exists
  const publicDir = path.dirname(outFile);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(outFile, spriteContent, 'utf-8');
  console.log(`SVG sprite oluşturuldu: ${outFile} (${files.length} ikon)`);
}

buildSprite();
