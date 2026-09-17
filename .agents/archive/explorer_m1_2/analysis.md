# Milestone 1: Component Polish & SF Pro Typography Analysis & Implementation Plan

**Author**: `explorer_m1_2` (UI Component & Interactive State Specialist)  
**Date**: 2026-09-02  
**Target Milestone**: Milestone 1 (Liquid Glass Design System & Theme Polish — Component & Typography Layer)  
**Target Directory**: `gui/src/components/commons/`, `gui/src/index.scss`, `gui/tailwind.config.ts`, `gui/src/components/home/`

---

## 1. Executive Summary

Milestone 1 establishes the foundational design system and visual polish for the macOS SlimeVR Electron utility redesign. While `explorer_m1_1` focuses on core liquid glass material tokens and theme definitions, this investigation analyzes and formulates the exact component architecture, native Apple SF Pro typography system, interactive micro-states (hover, active, pressed, focus-visible), and empty-state onboarding cues.

### Key Goals
1. **Component Modernization**: Elevate all reusable primitives in `gui/src/components/commons/` (Buttons, Inputs, Modals, Typography, Dropdowns, Checkboxes, Tooltips, ProgressBars, Selectors) to macOS design standards with 16–24px radiuses and liquid glass layering.
2. **SF Pro Typography Stack**: Unify headings, body text, captions, and telemetry pills under Apple's SF Pro font stack with strict optical tracking (tight display headings, legible text body) and tabular numbers (`tabular-nums`) for jitter-free telemetry readings.
3. **Tactile Micro-Interactions**: Implement snappy macOS-native hover, active/pressed scale transforms (`active:scale-[0.97-0.98]`), border luminescence, and accessible `focus-visible` rings with zero layout shift.
4. **Actionable Empty States**: Transform the bare, single-line text empty state in `Home.tsx` into a frosted glass onboarding hub with clear visual hierarchy, primary/secondary action triggers, and live diagnostic cues.

---

## 2. Comprehensive Component Audit (`gui/src/components/commons/`)

### 2.1 Button Component (`Button.tsx`, `BigButton.tsx`)
- **Current State**:
  - `Button.tsx` (142 lines) implements 4 variants (`primary`, `secondary`, `tertiary`, `quaternary`), supporting `NavLink` routing or native HTML `<button>`, loading spinner via `LoaderIcon`, and a `rounded` boolean for icon/circle buttons.
  - Sizing is hardcoded to `rounded-xl px-5 py-2.5` or `rounded-full p-2 min-h-[35px] min-w-[35px]`.
  - Focus state currently uses raw `focus:ring-4`, which creates a heavy, non-native ring around buttons.
  - `BigButton.tsx` (37 lines) is used for tall card-style action triggers (`rounded-xl p-3.5`).
- **Issues & Opportunities**:
  - Focus states lack `focus-visible` scoping (focus rings appear on mouse click instead of keyboard tab only).
  - Lack of frosted glass surface integration (`glass-interactive` class with backdrop blur).
  - Transition duration is inconsistent across variants (some use `transition-all`, others `transition-colors duration-150`).
- **Proposed Enhancement**:
  - Integrate `glass-interactive` styling into `secondary`, `tertiary`, and `quaternary` variants.
  - Standardize scale feedback: `active:scale-[0.98]` on regular buttons, `active:scale-[0.96]` on circular/icon buttons.
  - Refine focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-30/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background-80`.
  - Apply typography tokens: `text-standard-bold font-semibold tracking-tight text-[13px]`.

### 2.2 Input Component (`Input.tsx`, `FileInput.tsx`, `SystemFileInput.tsx`)
- **Current State**:
  - `Input.tsx` (165 lines) wraps `react-hook-form` `Controller` and native input with password visibility toggle (`EyeIcon`), error message toast underneath, and 3 variants (`primary`, `secondary`, `tertiary`).
  - Inputs use `bg-background-60` / `bg-background-50` with `rounded-md` (6px radius) and `min-h-[42px]`.
  - Focus ring uses `focus:ring-transparent focus:border-accent-background-40`.
- **Issues & Opportunities**:
  - 6px border radius clashes with the macOS 12–16px component geometry.
  - Error message absolute positioning at `top-[38px]` causes z-index clipping if inputs are closely stacked.
  - Placeholder text styling does not match SF Pro standard (`placeholder:italic placeholder:text-background-10` is visually distracting).
- **Proposed Enhancement**:
  - Upgrade radius to `rounded-xl` (12px) with subtle glass background: `bg-background-60/80 backdrop-blur-md border border-white/10`.
  - Refine placeholder: `placeholder:text-background-30 placeholder:not-italic placeholder:font-normal`.
  - Upgrade focus state: `focus:border-accent-background-30 focus:ring-2 focus:ring-accent-background-30/30 focus-visible:outline-none`.
  - Improve error display: inline fluid error pill with `text-status-critical text-[11px] font-medium mt-1`.

### 2.3 Modal Architecture (`BaseModal.tsx`, `Modal.tsx`, `ButtonConfirmModal.tsx`)
- **Current State**:
  - `BaseModal.tsx` wraps `react-modal` with overlay (`bg-background-90 bg-opacity-60`) and modal surface (`bg-background-60 p-6 rounded-lg m-2`).
  - `Modal.tsx` provides `EmptyModal` with simple centered overlay.
  - `ButtonConfirmModal.tsx` provides a confirm/cancel wrapper around `BaseModal`.
- **Issues & Opportunities**:
  - Backdrop lacks backdrop blur (`backdrop-filter: blur(16px)`), leading to muddy overlay visuals.
  - Modal surface radius is `rounded-lg` (8px) rather than macOS native `rounded-2xl` (16–20px).
  - Missing subtle border stroke (`border border-white/12` dark / `border border-black/8` light) and deep shadow elevation.
- **Proposed Enhancement**:
  - Overlay: `bg-background-90/60 backdrop-blur-md fixed inset-0 flex items-center justify-center z-50`.
  - Modal Box: `glass-panel-strong rounded-2xl p-6 shadow-2xl border border-white/12 max-w-lg w-full transform transition-all animate-fade-in`.
  - Header & Action layout: Clear visual separation with SF Pro `section-title` and spaced action buttons.

### 2.4 Typography Component (`Typography.tsx`)
- **Current State**:
  - `Typography.tsx` (102 lines) dynamically selects HTML tags (`h1`, `h2`, `p`) based on variant: `main-title`, `section-title`, `standard`, `vr-accessible`, `mobile-title`.
  - Applies color mapping (`primary` -> `text-background-10`, `secondary` -> `text-background-30`, custom classes).
  - Clamps lines based on user config text size.
  - Wraps in Fluent `<Localized>` when `id` prop is supplied.
- **Opportunities**:
  - Ensure all variants strictly map to the calibrated SF Pro tracking tokens (`tracking-tight`, `tracking-normal`, `tracking-wide`).
  - Add support for compact data pill typography (`text-pill` / 11–12px tabular numbers).
  - Add smooth color transition class for theme changes.

### 2.5 Checkbox & Toggle Switch (`Checkbox.tsx`)
- **Current State**:
  - Provides two variants: standard `checkbox` (using `@tailwindcss/forms`) and `toggle` (custom pill track with sliding pin).
  - Toggle track is `w-10 h-4 rounded-full`, pin is `h-2 w-2 rounded-full absolute m-1`.
- **Opportunities**:
  - Toggle switch sizing can be slightly increased to standard macOS proportions (`w-11 h-6` with `w-4 h-4` knob).
  - Add smooth spring transition on toggle sliding (`transition-transform duration-200 cubic-bezier(0.34, 1.56, 0.64, 1)`).
  - Add glass pill background for toggle off-state (`bg-background-50/60 border border-white/10`).

### 2.6 Dropdown Menus (`Dropdown.tsx`, `LangSelector.tsx`)
- **Current State**:
  - Portal-rendered floating dropdown menu with keyboard arrow navigation and scroll-into-view behavior.
  - Uses CSS custom properties for positioning (`--dropdown-field-left`, `--dropdown-field-top`, etc.).
  - Container uses `bg-background-60` with `rounded` (4px).
- **Opportunities**:
  - Upgrade dropdown list container to `glass-panel-strong rounded-xl border border-white/12 shadow-2xl overflow-hidden`.
  - Item styling: `px-3 py-2 text-[12px] font-medium rounded-lg mx-1 my-0.5 hover:bg-accent-background-30/20 hover:text-accent-background-20 transition-colors`.
  - Trigger pill: `glass-pill glass-interactive rounded-xl px-3 py-2 flex items-center justify-between`.

### 2.7 Tooltips & Callouts (`Tooltip.tsx`, `TipBox.tsx`, `ProgressBar.tsx`)
- **Tooltip**:
  - Uses floating portal with smart bounding box collision detection and window clamping.
  - Upgrade tooltip container to `glass-panel-strong text-[11px] font-medium tracking-tight rounded-lg py-1 px-2.5 shadow-lg border border-white/12`.
- **TipBox & WarningBox**:
  - Upgrade to frosted container: `bg-accent-background-30/15 border border-accent-background-30/30 rounded-xl p-3.5 backdrop-blur-md`.
- **ProgressBar**:
  - Liquid glass track: `bg-background-50/40 rounded-full overflow-hidden h-2`.
  - Progress fill: `bg-accent-background-20 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(10,132,255,0.4)]`.

---

## 3. SF Pro Typography System Specification

### 3.1 Font Family Stack Priority
```css
/* Priority font-family cascade for macOS native rendering */
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Text",
  "SF Pro Display",
  "SF Pro",
  "Helvetica Neue",
  Helvetica,
  Arial,
  sans-serif;
```

### 3.2 Optical Sizing & Tracking Matrix
Apple's SF Pro uses dynamic tracking based on point size to preserve legibility:

| Role | Font Size (rem / px) | Weight | Line Height | Letter Spacing | CSS Utility | Usage |
|------|----------------------|--------|-------------|----------------|-------------|-------|
| **Display Title** | 1.5rem (24px) | 700 (Bold) | 1.2 | `-0.025em` (`tracking-tight`) | `.text-main-title` | Modal headers, hero titles, onboarding titles |
| **Section Title** | 1.0rem (16px) | 600 (Semibold) | 1.3 | `-0.015em` (`tracking-tight`) | `.text-section-title` | Section headers, card titles, tracker names |
| **Standard Body** | 0.8125rem (13px) | 400 (Regular) | 1.45 | `-0.01em` (`tracking-normal`) | `.text-standard` | Body text, descriptions, settings labels |
| **Standard Bold** | 0.8125rem (13px) | 600 (Semibold) | 1.45 | `-0.01em` (`tracking-tight`) | `.text-standard-bold` | Button text, emphasized labels, table headers |
| **Telemetry / Pill**| 0.6875rem (11px) | 500 (Medium) | 1.2 | `0.0em` (`tracking-normal`) | `.text-pill` | Battery %, RSSI dBm, Ping ms, Status pills |
| **Micro Caption** | 0.625rem (10px) | 500 (Medium) | 1.2 | `+0.01em` (`tracking-wide`) | `.text-caption` | Timestamp, version dirty tag, hardware IDs |

### 3.3 Tabular Figures (`tabular-nums`)
Telemetry data frequently updates in real-time (Euler angles, battery percentage, ping, packets lost, TPS). Monospaced figures prevent jitter and layout shift:

```scss
/* Applied globally to body and data pills */
body,
.tabular-data,
.glass-pill,
.text-telemetry {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

---

## 4. Interactive States & Micro-Interaction Design

### 4.1 State Hierarchy Matrix

| State | Visual Treatment | Transform / Scale | Timing / Cubic Bezier | CSS Class / Selector |
|-------|------------------|-------------------|-----------------------|----------------------|
| **Default** | Standard glass background (`--glass-bg` / `--glass-bg-interactive`) + subtle border (`--glass-border`) | `scale(1)` | Base state | `.glass-interactive`, `.btn-glass` |
| **Hover** | Lifted glass background (`--glass-bg-interactive-hover`) + glowing border (`--glass-border-strong`) | `scale(1)` | `140ms cubic-bezier(0.2, 0, 0, 1)` | `&:hover`, `hover:bg-white/10` |
| **Pressed / Active** | Darkened or saturated background + border grip | `scale(0.97)` to `scale(0.98)` | `80ms cubic-bezier(0.2, 0, 0, 1)` | `&:active`, `active:scale-[0.98]` |
| **Focus-Visible** | macOS accent ring glow (`rgba(10, 132, 255, 0.6)`), 2px width, 2px offset | `scale(1)` | `140ms ease-out` | `focus-visible:ring-2 focus-visible:ring-accent-background-30/60` |
| **Disabled** | 40% opacity, cursor not-allowed, muted text (`text-background-40`) | `none` | Immediate | `disabled:opacity-40 disabled:cursor-not-allowed` |

### 4.2 Tailwind Utility Implementation
```scss
/* Global interactive micro-interaction definitions */
.glass-interactive {
  background: var(--glass-bg-interactive);
  border: 1px solid var(--glass-border);
  transition: background-color 140ms cubic-bezier(0.2, 0, 0, 1),
              border-color 140ms cubic-bezier(0.2, 0, 0, 1),
              transform 100ms cubic-bezier(0.2, 0, 0, 1),
              box-shadow 140ms cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: var(--glass-bg-interactive-hover);
    border-color: var(--glass-border-strong);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: scale(0.975);
    background: var(--glass-bg-interactive);
  }

  &:focus-visible {
    outline: none;
    ring: 2px solid rgb(var(--accent-background-30));
    ring-offset: 2px;
    ring-offset-color: rgb(var(--background-80));
  }
}
```

### 4.3 Reduced Motion Accessibility
Respect user system accessibility preferences:
```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
    transform: none !important;
  }
}
```

---

## 5. Empty-State Onboarding Cues & Visual Hierarchy

### 5.1 Analysis of Existing Empty State
- In `gui/src/components/home/Home.tsx` (lines 91–97):
  ```tsx
  {trackers.length === 0 && (
    <div className="flex px-5 pt-5 justify-center">
      <Typography variant="standard">
        {l10n.getString('home-no_trackers')}
      </Typography>
    </div>
  )}
  ```
- **Deficiencies**:
  - Plain unstyled text in a large empty window.
  - Zero actionable guidance on what the user should do next (power on trackers, check Wi-Fi, run setup wizard).
  - No visual cues indicating whether the SlimeVR backend server is connected or running.
  - Causes the window to feel like a broken or dead application.

### 5.2 Proposed Solution: `HomeEmptyState` Component
Create an elegant, frosted onboarding container with clear visual hierarchy:

```
┌────────────────────────────────────────────────────────┐
│                      [SlimeVR Icon]                    │
│                                                        │
│                 No Trackers Connected                  │
│   Turn on your SlimeVR hardware or connect new devices │
│                 to start full-body tracking.           │
│                                                        │
│   ┌───────────────────────────┐                        │
│   │  ⚡ Connect Trackers (Wi-Fi) │  <- Primary Action   │
│   └───────────────────────────┘                        │
│   ┌───────────────────────────┐                        │
│   │  📖 Open Setup Guide       │  <- Secondary Action │
│   └───────────────────────────┘                        │
│                                                        │
│   ● Server WebSocket: Connected  |  ● OSC Port: 9000   │
└────────────────────────────────────────────────────────┘
```

#### Key Elements:
1. **Prominent Glowing Icon**: Centered SlimeVR / Wifi icon with a gentle breathing pulse (`animate-pulse` with subtle ambient radial glow).
2. **SF Pro Typography Hierarchy**:
   - Title: `Typography variant="main-title"` ("No Trackers Connected") in `font-bold text-[18px] text-background-10`.
   - Description: `Typography variant="standard" color="secondary"` ("Power on your trackers or configure Wi-Fi credentials to begin.") in `text-[13px] text-background-30 max-w-sm`.
3. **Primary Action**: Prominent button ("Connect Trackers") navigating to `/onboarding/wifi-creds`.
4. **Secondary Action**: Subtle glass button ("Open Setup Guide / Checklist") navigating to `/onboarding/trackers-assign` or triggering tracking checklist.
5. **System Health Status Pill**: Real-time diagnostic badge displaying WebSocket connection state (`ws://localhost:21110`) and VRChat Quest OSC status (Port 9000).

---

## 6. Detailed Implementation Blueprints

### 6.1 `Typography.tsx` Refinement
```tsx
// Proposed refined Typography mappings:
const tagMap = {
  'main-title': 'h1',
  'section-title': 'h2',
  'mobile-title': 'h1',
  standard: 'p',
  'vr-accessible': 'p',
};

// Class mapping with strict SF Pro optical tracking:
variant === 'main-title' && 'text-main-title font-bold tracking-tight text-[20px] leading-tight',
variant === 'section-title' && 'text-section-title font-semibold tracking-tight text-[15px] leading-snug',
variant === 'standard' && (bold ? 'text-standard-bold font-semibold tracking-tight text-[13px]' : 'text-standard font-normal leading-relaxed text-[13px]'),
variant === 'vr-accessible' && (bold ? 'text-vr-accesible-bold font-semibold tracking-tight text-[15px]' : 'text-vr-accesible font-normal text-[15px]'),
color === 'primary' && 'text-background-10',
color === 'secondary' && 'text-background-30 font-normal',
color === 'muted' && 'text-background-40 text-[11px]',
```

### 6.2 `Button.tsx` Refinement
```tsx
// Refined button classes with macOS micro-interactions & focus-visible:
const variantsMap = {
  primary: classNames({
    'bg-accent-background-30 hover:bg-accent-background-20 text-background-10 font-semibold tracking-tight shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150':
      !disabled,
    'bg-accent-background-40/50 cursor-not-allowed text-accent-background-10/60':
      disabled,
  }),
  secondary: classNames({
    'glass-interactive text-background-10 font-semibold tracking-tight active:scale-[0.98]':
      !disabled,
    'bg-background-60/40 cursor-not-allowed text-background-40 border border-white/5':
      disabled,
  }),
  tertiary: classNames({
    'bg-background-50/60 hover:bg-background-40/80 text-background-10 font-medium tracking-tight active:scale-[0.98] border border-white/8 transition-all duration-150':
      !disabled,
    'bg-background-50/30 cursor-not-allowed text-background-40':
      disabled,
  }),
  quaternary: classNames({
    'hover:bg-background-60/50 text-background-20 hover:text-background-10 font-medium tracking-tight active:scale-[0.98] transition-all duration-150':
      !disabled,
    'cursor-not-allowed text-background-40':
      disabled,
  }),
};
```

### 6.3 `HomeEmptyState.tsx` (New Component Blueprint)
```tsx
import { NavLink } from 'react-router-dom';
import { Typography } from '@/components/commons/Typography';
import { Button } from '@/components/commons/Button';
import { SlimeVRIcon } from '@/components/commons/icon/SimevrIcon';
import { WifiIcon } from '@/components/commons/icon/WifiIcon';
import { useLocalization } from '@fluent/react';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import classNames from 'classnames';

export function HomeEmptyState() {
  const { l10n } = useLocalization();
  const { isConnected } = useWebsocketAPI();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 my-auto max-w-md mx-auto text-center glass-panel rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-accent-background-30/20 rounded-full blur-xl animate-pulse" />
        <div className="relative p-4 rounded-2xl glass-panel-strong border border-white/15 fill-accent-background-20 text-accent-background-20">
          <SlimeVRIcon width={36} height={36} />
        </div>
      </div>

      <Typography variant="main-title" className="text-[18px] font-bold tracking-tight text-background-10 mb-1.5">
        {l10n.getString('home-no_trackers') || 'No Trackers Connected'}
      </Typography>

      <Typography variant="standard" color="secondary" className="text-[12px] leading-relaxed mb-6 max-w-xs">
        Turn on your SlimeVR trackers or configure Wi-Fi credentials to start full-body tracking.
      </Typography>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <NavLink to="/onboarding/wifi-creds" className="w-full">
          <Button variant="primary" className="w-full justify-center gap-2 py-2.5 rounded-xl shadow-md">
            <WifiIcon value={1} disabled={false} />
            <span>Connect Trackers (Wi-Fi)</span>
          </Button>
        </NavLink>

        <NavLink to="/onboarding/trackers-assign" className="w-full">
          <Button variant="secondary" className="w-full justify-center py-2.5 rounded-xl">
            <span>Interactive Setup Guide</span>
          </Button>
        </NavLink>
      </div>

      <div className="mt-6 pt-4 border-t border-background-50/30 w-full flex items-center justify-center gap-2 text-[11px] text-background-30">
        <div className={classNames('w-2 h-2 rounded-full', isConnected ? 'bg-status-success animate-pulse' : 'bg-status-critical')} />
        <span>{isConnected ? 'SlimeVR Server Online' : 'SlimeVR Server Offline'}</span>
      </div>
    </div>
  );
}
```

---

## 7. Verification Method

1. **Static Type Safety**:
   - Command: `cd gui && npx tsc --noEmit`
   - Requirement: 0 errors.
2. **Lint & Code Style**:
   - Command: `cd gui && npx eslint src/components/commons/`
   - Requirement: 0 warnings, 0 errors.
3. **Interactive & Visual Checks**:
   - Button hover, click, and active scale animations respond within 140ms.
   - Keyboard tab navigation reveals clear `focus-visible` rings on all interactive elements without mouse click contamination.
   - Empty state renders cleanly in `Home.tsx` when tracker store is empty, with working navigation links.
   - SF Pro typography renders crisp tabular figures across tracker telemetry and status badges.
