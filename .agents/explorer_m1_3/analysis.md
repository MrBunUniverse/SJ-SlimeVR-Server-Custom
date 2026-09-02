# Linter, Code Cleanliness & Build Verification Analysis (M1)

**Agent**: `explorer_m1_3` (Role: Linter, Code Cleanliness & Build Verification Specialist)  
**Date**: 2026-09-02  
**Target**: `gui/` (Electron + React 18 + TypeScript + Vite)  
**Scope**: Formulate exact code fixes and style rules for 0-error, 0-warning baseline compliance.

---

## 1. Executive Summary

A comprehensive scan was conducted across the SlimeVR GUI codebase using TypeScript (`tsc --noEmit`), ESLint (`eslint --max-warnings=0`), Prettier (`prettier --check`), and Vite/Electron-Vite (`electron-vite build`).

### Current Status Matrix
| Verification Stage | Command | Current Status | Issues Found |
|---|---|---|---|
| **TypeScript Static Analysis** | `npx tsc --noEmit` | **PASS (Exit 0)** | 0 type errors |
| **Production Bundler** | `npx electron-vite build` | **PASS (Exit 0)** | Built in 56.51s, 2231 modules transformed |
| **ESLint Static Linter** | `npx eslint --max-warnings=0 "{electron,src}/**/*.{js,jsx,ts,tsx,json}"` | **FAIL (Exit 1)** | 2 errors (`no-empty`), 2 warnings (`@typescript-eslint/no-unused-vars`) |
| **Prettier Code Formatter** | `npx prettier --check "{electron,src}/**/*.{js,jsx,ts,tsx,css,scss,md,json}"` | **FAIL (Exit 1)** | 12 files require formatting |

---

## 2. Root Cause Analysis of Known Issues

### Issue 1: Empty `catch {}` Blocks in `gui/src/hooks/presets.ts`
- **Location**: `gui/src/hooks/presets.ts` lines 60–69.
- **ESLint Rule**: `no-empty` (from `eslint.configs.recommended`).
- **Verbatim Error**:
  ```
  /Volumes/Mac HDD/Win HDD Secondary/Documents/Mac Docs/Project/Programing Project/SJ SlimeVR Sever/gui/src/hooks/presets.ts
    62:13  error  Empty block statement  no-empty
    68:13  error  Empty block statement  no-empty
  ```
- **Code Observation**:
  ```ts
  59:   useEffect(() => {
  60:     try {
  61:       localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  62:     } catch {}
  63:   }, [presets]);
  64: 
  65:   useEffect(() => {
  66:     try {
  67:       localStorage.setItem(ACTIVE_PRESET_KEY, activePresetId);
  68:     } catch {}
  69:   }, [activePresetId]);
  ```
- **Root Cause**: The catch blocks intentionally silence `localStorage` quota and write access exceptions (e.g. in private browsing or constrained environments), but contain no statements or comments. Under ESLint's default configuration for `no-empty` (`allowEmptyCatch: false`), an empty block is forbidden unless it contains an explanatory comment. Note that `spaced-comment` is also enabled as `'error'`, requiring standard spacing after `//`.
- **Target Fix**: Add explanatory comments inside both catch blocks (e.g., `// Ignore localStorage write/quota errors`).

---

### Issue 2: Unused Variable `setSettingsOpen` in `gui/src/components/home/Home.tsx`
- **Location**: `gui/src/components/home/Home.tsx` line 37.
- **ESLint Rule**: `@typescript-eslint/no-unused-vars` (warn policy).
- **Verbatim Warning**:
  ```
  /Volumes/Mac HDD/Win HDD Secondary/Documents/Mac Docs/Project/Programing Project/SJ SlimeVR Sever/gui/src/components/home/Home.tsx
    37:12  warning  'setSettingsOpen' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  ```
- **Code Observation**:
  ```tsx
  36:   const settingsOpenState = useState(false);
  37:   const [, setSettingsOpen] = settingsOpenState;
  ...
  47:       <HomeSettingsModal open={settingsOpenState} />
  ```
- **Root Cause**: `HomeSettingsModal` receives the entire `useState` tuple `[boolean, Dispatch<SetStateAction<boolean>>]` via `open={settingsOpenState}`. Destructuring `const [, setSettingsOpen] = settingsOpenState;` on line 37 is redundant because `setSettingsOpen` is never invoked directly in `Home.tsx`.
- **Target Fix**: Delete line 37 completely.

---

### Issue 3: Unused Type Import `TrackerPreset` in `gui/src/components/home/PresetSelector.tsx`
- **Location**: `gui/src/components/home/PresetSelector.tsx` line 2.
- **ESLint Rule**: `@typescript-eslint/no-unused-vars` (warn policy).
- **Verbatim Warning**:
  ```
  /Volumes/Mac HDD/Win HDD Secondary/Documents/Mac Docs/Project/Programing Project/SJ SlimeVR Sever/gui/src/components/home/PresetSelector.tsx
    2:29  warning  'TrackerPreset' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  ```
- **Code Observation**:
  ```tsx
  1: import { useState } from 'react';
  2: import { useTrackerPresets, TrackerPreset } from '@/hooks/presets';
  ```
- **Root Cause**: `PresetSelector` relies on the hook `useTrackerPresets()`, which returns typed properties (`presets`, `activePreset`, etc.), so the explicit `TrackerPreset` interface import is unreferenced.
- **Target Fix**: Remove `TrackerPreset` from the import statement on line 2, changing it to `import { useTrackerPresets } from '@/hooks/presets';`.

---

### Issue 4: Prettier Formatting Violations across 12 Files
- **Command**: `npx prettier --list-different "{electron,src}/**/*.{js,jsx,ts,tsx,css,scss,md,json}"`
- **Config**: `.prettierrc` (Root):
  ```json
  {
    "trailingComma": "es5",
    "tabWidth": 2,
    "semi": true,
    "singleQuote": true
  }
  ```
- **Flagged Files**:
  1. `gui/src/components/commons/BigButton.tsx`
  2. `gui/src/components/commons/Typography.tsx`
  3. `gui/src/components/home/Home.tsx`
  4. `gui/src/components/home/PresetSelector.tsx`
  5. `gui/src/components/home/QuestDiagnosticsPill.tsx`
  6. `gui/src/components/Navbar.tsx`
  7. `gui/src/components/settings/pages/InterfaceSettings.tsx`
  8. `gui/src/components/Toolbar.tsx`
  9. `gui/src/components/TopBar.tsx`
  10. `gui/src/components/tracker/TrackerStatus.tsx`
  11. `gui/src/hooks/presets.ts`
  12. `gui/src/index.scss`

---

## 3. Exact Implementation Plan & Diffs

### Diff 1: `gui/src/hooks/presets.ts`

```diff
--- a/gui/src/hooks/presets.ts
+++ b/gui/src/hooks/presets.ts
@@ -23,12 +23,26 @@ export const DEFAULT_PRESETS: TrackerPreset[] = [
     name: 'Standard (5-Tracker)',
     description: 'Waist, Knees, Feet set for full leg tracking',
     targetCount: 5,
-    bodyParts: ['waist', 'left_lower_leg', 'right_lower_leg', 'left_foot', 'right_foot'],
+    bodyParts: [
+      'waist',
+      'left_lower_leg',
+      'right_lower_leg',
+      'left_foot',
+      'right_foot',
+    ],
   },
   {
     id: 'full-body',
     name: 'Full Body (Enhanced)',
     description: 'Chest, Waist, Upper/Lower Legs & Feet',
     targetCount: 8,
-    bodyParts: ['chest', 'waist', 'left_upper_leg', 'right_upper_leg', 'left_lower_leg', 'right_lower_leg', 'left_foot', 'right_foot'],
+    bodyParts: [
+      'chest',
+      'waist',
+      'left_upper_leg',
+      'right_upper_leg',
+      'left_lower_leg',
+      'right_lower_leg',
+      'left_foot',
+      'right_foot',
+    ],
   },
   {
     id: 'sitting',
@@ -59,11 +73,15 @@ export function useTrackerPresets() {
   useEffect(() => {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
-    } catch {}
+    } catch {
+      // Ignore localStorage write/quota errors
+    }
   }, [presets]);
 
   useEffect(() => {
     try {
       localStorage.setItem(ACTIVE_PRESET_KEY, activePresetId);
-    } catch {}
+    } catch {
+      // Ignore localStorage write/quota errors
+    }
   }, [activePresetId]);
```

---

### Diff 2: `gui/src/components/home/Home.tsx`

```diff
--- a/gui/src/components/home/Home.tsx
+++ b/gui/src/components/home/Home.tsx
@@ -34,7 +34,6 @@ export function Home() {
   };
 
   const settingsOpenState = useState(false);
-  const [, setSettingsOpen] = settingsOpenState;
 
   const toggleLayout = () => {
     setConfig({
```

---

### Diff 3: `gui/src/components/home/PresetSelector.tsx`

```diff
--- a/gui/src/components/home/PresetSelector.tsx
+++ b/gui/src/components/home/PresetSelector.tsx
@@ -1,5 +1,5 @@
 import { useState } from 'react';
-import { useTrackerPresets, TrackerPreset } from '@/hooks/presets';
+import { useTrackerPresets } from '@/hooks/presets';
 import { Typography } from '@/components/commons/Typography';
 import { BaseModal } from '@/components/commons/BaseModal';
 import { Button } from '@/components/commons/Button';
```

---

### Diff 4: Prettier Automation Command

To resolve all remaining formatting discrepancies cleanly without risk of manual typo:
```bash
cd gui && pnpm run format
```
This executes `prettier --write "{electron,src}/**/*.{js,jsx,ts,tsx,css,scss,md,json}"` with the project-level `.prettierrc` configuration.

---

## 4. Verification Workflow for Worker Agent

After applying the diffs above, the Worker agent can verify 100% compliance using the project's official lint script:

```bash
cd gui && pnpm run lint
```
Equivalent pipeline:
1. `npx tsc --noEmit` -> Must return code 0 (0 errors).
2. `npx eslint --max-warnings=0 "{electron,src}/**/*.{js,jsx,ts,tsx,json}"` -> Must return code 0 (0 errors, 0 warnings).
3. `npx prettier --check "{electron,src}/**/*.{js,jsx,ts,tsx,css,scss,md,json}"` -> Must return code 0 (all files formatted).
4. `pnpm run build` -> Must complete with exit code 0.
