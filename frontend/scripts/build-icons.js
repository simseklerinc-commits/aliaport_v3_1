/**
 * Icon Sprite Builder
 * 
 * Bu script tüm SVG iconları tek bir sprite dosyasında birleştirir.
 * - src/assets/icons/*.svg → public/icon-sprite.svg
 * - TypeScript type definition oluşturur
 * - Single HTTP request (performans)
 * 
 * Kullanım: node scripts/build-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../src/assets/icons');
const OUTPUT_SVG = path.join(__dirname, '../public/icon-sprite.svg');
const OUTPUT_TYPES = path.join(__dirname, '../src/shared/ui/icon-names.ts');

// SVG dosyalarını oku
const iconFiles = fs.readdirSync(ICONS_DIR).filter(file => file.endsWith('.svg'));
const iconNames = iconFiles.map(file => path.basename(file, '.svg'));

console.log(`📦 Building icon sprite from ${iconFiles.length} icons...`);

// Sprite SVG oluştur
let spriteContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;">
`;

iconFiles.forEach(file => {
  const iconName = path.basename(file, '.svg');
  const svgContent = fs.readFileSync(path.join(ICONS_DIR, file), 'utf-8');
  
  // SVG içeriğinden sadece path/circle/line vb. elementleri al
  const match = svgContent.match(/<svg[^>]*>(.*?)<\/svg>/s);
  if (match) {
    const innerContent = match[1].trim();
    spriteContent += `  <symbol id="icon-${iconName}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${innerContent}
  </symbol>
`;
  }
});

spriteContent += `</svg>
`;

// Sprite dosyasını yaz
fs.writeFileSync(OUTPUT_SVG, spriteContent);
console.log(`✅ Sprite generated: ${OUTPUT_SVG}`);

// TypeScript type definition oluştur
const typesContent = `/**
 * Icon Names - Auto-generated
 * 
 * Bu dosya otomatik oluşturulmuştur: scripts/build-icons.js
 * Manuel düzenleme yapmayın!
 */

export type IconName =
${iconNames.map(name => `  | '${name}'`).join('\n')};

export const iconNames: ReadonlyArray<IconName> = [
${iconNames.map(name => `  '${name}',`).join('\n')}
] as const;
`;

fs.writeFileSync(OUTPUT_TYPES, typesContent);
console.log(`✅ Types generated: ${OUTPUT_TYPES}`);
console.log(`\n📊 Total icons: ${iconNames.length}`);
console.log(`\n🎯 Usage: <Icon name="add" size={20} />`);
