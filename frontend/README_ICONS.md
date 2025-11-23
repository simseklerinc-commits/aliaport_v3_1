# Icon System - Aliaport Frontend

## 📋 Overview

Aliaport uses an **SVG sprite system** for optimal icon performance:
- **Single HTTP request** - All icons loaded at once
- **Cached** - Browser caches sprite file
- **Type-safe** - TypeScript autocomplete for icon names
- **Small bundle** - Icons not included in JS bundle

---

## 🎯 Usage

### Basic Usage

```tsx
import { Icon } from '@/shared/ui/Icon';

// Simple icon
<Icon name="add" />

// Custom size
<Icon name="edit" size={24} />

// With styling
<Icon name="delete" className="text-red-500" />

// With accessibility
<Icon name="info" title="Daha fazla bilgi" />

// Decorative (hidden from screen readers)
<Icon name="chevron-right" decorative />
```

### Available Icons

Current icon set (21 icons):
- **Actions**: `add`, `edit`, `delete`, `search`, `view`, `close`, `check`
- **Navigation**: `chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`
- **UI**: `filter`, `refresh`, `menu`, `settings`
- **File**: `download`, `upload`
- **Status**: `info`, `warning`, `error`, `success`

---

## 🔧 Adding New Icons

### 1. Add SVG File

Place your SVG in `src/assets/icons/[name].svg`:

```xml
<!-- src/assets/icons/calendar.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
  <line x1="16" y1="2" x2="16" y2="6"></line>
  <line x1="8" y1="2" x2="8" y2="6"></line>
  <line x1="3" y1="10" x2="21" y2="10"></line>
</svg>
```

**Requirements:**
- Must be 24x24 viewBox
- Use `currentColor` for stroke/fill (allows CSS color control)
- Simple paths only (no complex gradients/effects)

### 2. Rebuild Sprite

```bash
npm run build:icons
```

This automatically:
1. Scans `src/assets/icons/*.svg`
2. Generates `public/icon-sprite.svg` (sprite file)
3. Generates `src/shared/ui/icon-names.ts` (TypeScript types)

### 3. Use New Icon

```tsx
<Icon name="calendar" /> {/* TypeScript will autocomplete! */}
```

---

## 🏗️ Build Process

### Development

Icons are built automatically before `npm run dev`:

```bash
npm run dev
# Runs: predev → build:icons → vite
```

### Production

Icons are built automatically before `npm run build`:

```bash
npm run build
# Runs: prebuild → build:icons → vite build
```

### Manual Build

```bash
npm run build:icons
```

---

## 📦 File Structure

```
frontend/
├── src/
│   ├── assets/
│   │   └── icons/
│   │       ├── add.svg              # Source SVG files
│   │       ├── edit.svg
│   │       └── ...
│   └── shared/
│       └── ui/
│           ├── Icon.tsx             # Icon component
│           └── icon-names.ts        # Auto-generated types ⚙️
├── public/
│   └── icon-sprite.svg              # Auto-generated sprite ⚙️
├── scripts/
│   └── build-icons.js               # Build script
└── package.json
```

**⚙️ = Auto-generated** (Do not edit manually!)

---

## 🎨 Styling Icons

### Color

Icons use `currentColor` by default, so they inherit text color:

```tsx
<div className="text-blue-500">
  <Icon name="info" /> {/* Will be blue */}
</div>
```

### Size

Size prop sets width/height in pixels:

```tsx
<Icon name="add" size={16} />  {/* 16x16 px */}
<Icon name="add" size={20} />  {/* 20x20 px (default) */}
<Icon name="add" size={24} />  {/* 24x24 px */}
```

### Custom Styling

```tsx
<Icon 
  name="warning" 
  size={32}
  className="text-yellow-500 hover:text-yellow-600 transition-colors"
/>
```

---

## ♿ Accessibility

### Decorative Icons

If icon is purely decorative (has adjacent text), mark as decorative:

```tsx
<button>
  <Icon name="add" decorative />
  <span>Yeni Ekle</span>
</button>
```

### Meaningful Icons

If icon conveys meaning, provide title:

```tsx
<button aria-label="Sil">
  <Icon name="delete" title="Sil" />
</button>
```

---

## 🚀 Performance

### Benefits

1. **Single Request**: All icons loaded in one SVG sprite (~5KB gzipped)
2. **Cached**: Sprite cached by browser
3. **No JS Bundle Bloat**: Icons not included in JavaScript
4. **Instant Rendering**: No network delay after first load

### Metrics

- **Total icons**: 21
- **Sprite size**: ~8KB (uncompressed), ~3KB (gzipped)
- **Load time**: <50ms (first load), <1ms (cached)

---

## 🔍 Icon Guidelines

### When to Add Icons

- **Consistent actions** across the app (edit, delete, search)
- **Common UI patterns** (chevrons, close buttons)
- **Status indicators** (success, error, warning)

### When NOT to Add Icons

- **One-off use** - Use inline SVG instead
- **Complex graphics** - Use image file instead
- **Brand logos** - Use separate asset management

---

## 🐛 Troubleshooting

### Icon Not Showing

1. **Check sprite is loaded**: Open DevTools → Network → `icon-sprite.svg` (should be 200 OK)
2. **Check icon name**: TypeScript should autocomplete valid names
3. **Rebuild sprite**: `npm run build:icons`

### TypeScript Errors

If you see `IconName` type errors:

```bash
npm run build:icons  # Regenerate icon-names.ts
```

### Icon Appears as Box

Sprite not loaded. Check `index.html` includes:

```html
<iframe src="/icon-sprite.svg" style="display: none;"></iframe>
```

---

## 📚 Resources

- **SVG Sprite Technique**: https://css-tricks.com/svg-sprites-use-better-icon-fonts/
- **Icon Source**: Feather Icons (https://feathericons.com/)
- **Accessibility**: https://www.w3.org/WAI/tutorials/images/decorative/

---

**Last Updated**: 23 Kasım 2025  
**Maintained By**: Frontend Team
