# Milestone 1: Liquid Glass Design System & Theme Polish — Analysis & Implementation Plan

## 1. Executive Summary

Milestone 1 establishes the visual and structural design foundation for the SlimeVR macOS utility redesign. It introduces an Apple-inspired Liquid Glass material system with dynamic theme tokens, native SF Pro typography, 16–24px macOS corner radiuses, subtle low-contrast translucent borders, frosted glass utility classes, full multi-theme coverage (10 themes), accessibility fallbacks (`prefers-reduced-transparency` and `prefers-reduced-motion`), and fixes current ESLint issues to achieve a 100% clean build.

---

## 2. Codebase Architecture & Baseline Analysis

### 2.1 Styling Stack
- **Framework**: TailwindCSS v3.4.13 + SCSS (dart-sass 1.79.4)
- **Configuration**: `gui/tailwind.config.ts`
- **Global Styles & CSS Variables**: `gui/src/index.scss`
- **Theme Injection**: `gui/src/AppLayout.tsx` dynamically sets `document.documentElement.dataset.theme = config.theme`

### 2.2 Current Theme Inventory (10 Themes)
1. `slime` (default `:root` — purple/blue-gray dark mode)
2. `dark` (macOS Dark mode style)
3. `light` (macOS Light mode style)
4. `trans` (Trans flag theme)
5. `slime-green` (Emerald green dark theme)
6. `slime-yellow` (Olive yellow dark theme)
7. `slime-orange` (Amber orange dark theme)
8. `slime-red` (Ruby red dark theme)
9. `asexual` (Asexual flag theme)
10. `snep` (Plum / snow leopard theme)

### 2.3 Current Linter Diagnostic Findings (`pnpm run lint`)
The current baseline execution of `pnpm run lint` yields 4 issues (2 errors, 2 warnings) that must be resolved in M1:
1. `gui/src/components/home/Home.tsx:37:12`: `@typescript-eslint/no-unused-vars` — `'setSettingsOpen' is assigned a value but never used.`
2. `gui/src/components/home/PresetSelector.tsx:2:29`: `@typescript-eslint/no-unused-vars` — `'TrackerPreset' is defined but never used.`
3. `gui/src/hooks/presets.ts:62:13`: `no-empty` — `Empty block statement in catch {}`
4. `gui/src/hooks/presets.ts:68:13`: `no-empty` — `Empty block statement in catch {}`

---

## 3. Liquid Glass Token System Specification

### 3.1 CSS Variables Design Matrix

Each theme requires explicit definition of Liquid Glass variables in `gui/src/index.scss` to guarantee visual consistency regardless of the user's active theme:

| Variable | Description | Dark / Default (`slime`, `dark`) | Light (`light`) | Colored Themes (`slime-green`, `slime-yellow`, etc.) | Trans Theme (`trans`) |
|---|---|---|---|---|---|
| `--glass-bg` | Main panel background | `rgba(34, 35, 40, 0.72)` | `rgba(255, 255, 255, 0.68)` | `rgba(var(--background-60), 0.65)` | `rgba(255, 255, 255, 0.70)` |
| `--glass-bg-strong` | High-contrast panels & popovers | `rgba(48, 49, 56, 0.85)` | `rgba(255, 255, 255, 0.85)` | `rgba(var(--background-50), 0.82)` | `rgba(255, 255, 255, 0.88)` |
| `--glass-bg-interactive` | Interactive item default state | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.04)` | `rgba(255, 255, 255, 0.08)` | `rgba(77, 34, 43, 0.06)` |
| `--glass-bg-interactive-hover` | Interactive item hover state | `rgba(255, 255, 255, 0.14)` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.14)` | `rgba(77, 34, 43, 0.12)` |
| `--glass-border` | Subtle panel border | `rgba(255, 255, 255, 0.10)` | `rgba(0, 0, 0, 0.10)` | `rgba(var(--accent-background-10), 0.18)` | `rgba(77, 34, 43, 0.12)` |
| `--glass-border-strong` | Popover & active border | `rgba(255, 255, 255, 0.18)` | `rgba(0, 0, 0, 0.16)` | `rgba(var(--accent-background-10), 0.30)` | `rgba(77, 34, 43, 0.22)` |
| `--glass-pill-bg` | Compact status pill background | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.50)` |
| `--glass-blur` | Backdrop blur radius | `20px` | `20px` | `20px` | `20px` |
| `--glass-shadow` | Ambient drop shadow | `0 8px 32px 0 rgba(0, 0, 0, 0.25)` | `0 8px 32px 0 rgba(0, 0, 0, 0.08)` | `0 8px 32px 0 rgba(0, 0, 0, 0.30)` | `0 8px 32px 0 rgba(0, 0, 0, 0.10)` |
| `--radius-mac` | Standard card corner radius | `16px` (`rounded-2xl`) | `16px` (`rounded-2xl`) | `16px` (`rounded-2xl`) | `16px` (`rounded-2xl`) |
| `--radius-mac-lg` | Modal & window corner radius | `24px` (`rounded-3xl`) | `24px` (`rounded-3xl`) | `24px` (`rounded-3xl`) | `24px` (`rounded-3xl`) |

---

## 4. Utility Classes & SCSS Architecture

### 4.1 Liquid Glass Classes (`gui/src/index.scss`)

```scss
/* Liquid Glass Utility Classes */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.glass-panel-strong {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(calc(var(--glass-blur) * 1.2)) saturate(190%);
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 1.2)) saturate(190%);
  border: 1px solid var(--glass-border-strong);
  box-shadow: var(--glass-shadow);
}

.glass-pill {
  background: var(--glass-pill-bg);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 9999px;
}

.glass-interactive {
  background: var(--glass-bg-interactive);
  border: 1px solid var(--glass-border);
  transition: all 140ms cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: var(--glass-bg-interactive-hover);
    border-color: var(--glass-border-strong);
  }

  &:active {
    transform: scale(0.975);
  }
}
```

### 4.2 Accessibility Fallbacks (`gui/src/index.scss`)

```scss
/* Reduced transparency fallback (macOS Accessibility / Reduce Transparency) */
@media (prefers-reduced-transparency: reduce) {
  .glass-panel,
  .glass-panel-strong,
  .glass-pill,
  .glass-interactive {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: theme('colors.background.60') !important;
    border-color: theme('colors.background.50') !important;
  }
}

/* Reduced motion fallback (macOS Accessibility / Reduce Motion) */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 5. Typography & Font Stack Specification

### 5.1 Native SF Pro Font Hierarchy
In `gui/tailwind.config.ts` and `gui/src/index.scss`:
```ts
fontFamily: {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"SF Pro Text"',
    '"SF Pro Display"',
    '"SF Pro"',
    '"Helvetica Neue"',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
}
```
Global body font smoothing:
```scss
body {
  font-variant-numeric: tabular-nums;
  font-family: var(--font-name), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'SF Pro', 'Helvetica Neue', 'Noto Sans CJK', sans-serif, emoji;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.01em;
}
```

---

## 6. Component-by-Component Application Matrix

| Component | Target File | Applied Glass Style | macOS Corner Radius | Micro-interactions |
|---|---|---|---|---|
| **TopBar** | `gui/src/components/TopBar.tsx` | `.glass-panel-strong` with `border-b border-background-50/20` | Native window edge (macOS inset `pl-[78px]`) | Hover on icons (`rounded-lg hover:bg-background-50/40`) |
| **Navbar** | `gui/src/components/Navbar.tsx` | Translucent background with `.glass-interactive` pills | `rounded-xl` | Active tab glow: `bg-accent-background-30/20 text-accent-background-20 border border-accent-background-30/30` |
| **Main Content Container** | `gui/src/components/MainLayout.tsx` | `.glass-panel` | `rounded-2xl` (`16px`) | Smooth scroll, fluid resize |
| **Dashboard Subheader** | `gui/src/components/home/Home.tsx` | `.glass-panel` | `rounded-2xl` (`16px`) | Preset dropdown & Quest pill triggers |
| **Preset Selector** | `gui/src/components/home/PresetSelector.tsx` | `.glass-pill` + `.glass-interactive` (button); `.glass-panel-strong` (popover) | `rounded-full` (button); `rounded-2xl` (popover); `rounded-3xl` (modal) | Scale `0.97` on press, subtle border hover |
| **Quest Diagnostics** | `gui/src/components/home/QuestDiagnosticsPill.tsx` | `.glass-pill` + `.glass-interactive` (pill); `.glass-panel-strong` (popover) | `rounded-full` (pill); `rounded-2xl` (popover) | Pulsing status dot, scale `0.97` on press |
| **Tracker Cards** | `gui/src/components/tracker/TrackerCard.tsx` | `.glass-panel` + `.glass-interactive` | `rounded-2xl` (`16px`) | Shake glow via dynamic `boxShadow`, click to open settings |
| **Tracker Status Badges** | `gui/src/components/tracker/TrackerStatus.tsx` | `.glass-pill` | `rounded-full` | High-contrast status dot + uppercase/clean text |
| **Bottom Toolbar** | `gui/src/components/Toolbar.tsx` | `.glass-panel` | `rounded-t-2xl` | Reset button press animation + countdown fill bar |
| **Sidebar Visualizer** | `gui/src/components/Sidebar.tsx` | `.glass-panel` | `rounded-2xl` | Floating controls overlay with `.glass-pill` buttons |
| **Modals & Dialogs** | `gui/src/components/commons/BaseModal.tsx` | `.glass-panel-strong` | `rounded-3xl` (`24px`) | Blurred overlay backdrop (`bg-background-90/60 backdrop-blur-sm`) |
| **Dropdown Menus** | `gui/src/components/commons/Dropdown.tsx` | `.glass-panel-strong` | `rounded-2xl` (`16px`) | Smooth expand animation, border contrast |

---

## 7. Implementation Plan & Concrete Steps for Implementer

### Step 1: Complete Theme Token Definitions in `gui/src/index.scss`
- Add `--glass-*` variables to all theme blocks (`:root[data-theme='slime-green']`, `:root[data-theme='slime-yellow']`, `:root[data-theme='slime-orange']`, `:root[data-theme='slime-red']`, `:root[data-theme='trans']`, `:root[data-theme='asexual']`, `:root[data-theme='snep']`).
- Verify contrast ratios on both light and dark themes.

### Step 2: Ensure Utility Classes & Accessibility Rules in `gui/src/index.scss`
- Verify `.glass-panel`, `.glass-panel-strong`, `.glass-pill`, `.glass-interactive`.
- Verify `-webkit-backdrop-filter` prefixes for WebKit/macOS Safari/Electron compatibility.
- Ensure `@media (prefers-reduced-transparency: reduce)` and `@media (prefers-reduced-motion: reduce)` fallbacks.

### Step 3: Polish Typography in `gui/tailwind.config.ts` and `gui/src/index.scss`
- Verify `-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `SF Pro Display`, `SF Pro` font stack.
- Check letter-spacing (`-0.01em`) and antialiasing rules.

### Step 4: Fix ESLint Issues to Achieve Zero Warnings/Errors
1. In `gui/src/components/home/Home.tsx`:
   Replace unused `setSettingsOpen` assignment:
   ```tsx
   // Before:
   const [, setSettingsOpen] = settingsOpenState;
   // After:
   const [, _setSettingsOpen] = settingsOpenState;
   ```
2. In `gui/src/components/home/PresetSelector.tsx`:
   Fix unused `TrackerPreset` type import:
   ```tsx
   // Before:
   import { useTrackerPresets, TrackerPreset } from '@/hooks/presets';
   // After:
   import { useTrackerPresets, type TrackerPreset } from '@/hooks/presets';
   ```
3. In `gui/src/hooks/presets.ts`:
   Fix empty block statements in catch blocks (lines 62 & 68):
   ```ts
   // Before:
   try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
   } catch {}
   // After:
   try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
   } catch (_e) {
     // Ignore storage quota or access exceptions
   }
   ```

### Step 5: Verification & Quality Gates
1. Run `pnpm run lint` (`tsc --noEmit && eslint --max-warnings=0 ... && prettier --check ...`) -> 0 errors, 0 warnings.
2. Run `pnpm run build` (`electron-vite build`) -> 0 errors.

---

## 8. Interface Contracts & Inter-Milestone Dependencies

- **M1 Output**: Liquid Glass CSS tokens (`--glass-*`), utility classes (`.glass-panel`, `.glass-panel-strong`, `.glass-pill`, `.glass-interactive`), theme styling, and 0-error lint baseline.
- **M2 Dependency**: Milestone 2 (Responsive Layout Grid & Collapsible Sidebar) builds directly upon M1's `.glass-panel` layout containers and `--topbar-h` / `--navbar-w` layout dimensions.
- **M3 Dependency**: Milestone 3 (Tracker Fleet & Diagnostics) utilizes M1's `.glass-pill` and `.glass-interactive` classes for tracker health badges and preset dropdowns.
