import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateLayoutDimensions,
  calculateSidebarHeights,
  calculateShakeHighlightGlow,
  formatEstimatedHeight,
  formatEulerVector,
  getBatteryStatus,
  evaluateQuestDiagnostics,
  ResetCountdownController,
} from './helpers/test-utils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GUI_ROOT = path.resolve(__dirname, '..');
const SCSS_PATH = path.join(GUI_ROOT, 'src', 'index.scss');

describe('Tier 1: Feature Coverage (F1 - F8)', () => {
  // -------------------------------------------------------------
  // F1: Liquid Glass Tokens & Material Polish
  // -------------------------------------------------------------
  describe('F1: Liquid Glass Tokens & Material Polish', () => {
    const scssContent = fs.readFileSync(SCSS_PATH, 'utf-8');

    it('F1.1: defines primary --glass-bg with 0.72 alpha dark vibrancy in CSS variables', () => {
      assert.match(scssContent, /--glass-bg:\s*rgba\(34,\s*35,\s*40,\s*0\.72\);/);
      assert.match(scssContent, /--glass-bg-strong:\s*rgba\(48,\s*49,\s*56,\s*0\.85\);/);
    });

    it('F1.2: defines --glass-blur token as 20px and frosted border tokens', () => {
      assert.match(scssContent, /--glass-blur:\s*20px;/);
      assert.match(scssContent, /--glass-border:\s*rgba\(255,\s*255,\s*255,\s*0\.10\);/);
      assert.match(scssContent, /--glass-border-strong:\s*rgba\(255,\s*255,\s*255,\s*0\.18\);/);
    });

    it('F1.3: defines .glass-panel and .glass-panel-strong utility classes with backdrop-filter', () => {
      assert.match(scssContent, /\.glass-panel\s*\{[^}]*backdrop-filter:\s*blur\(var\(--glass-blur\)\)/);
      assert.match(scssContent, /\.glass-panel-strong\s*\{[^}]*backdrop-filter:\s*blur\(calc\(var\(--glass-blur\)\s*\*\s*1\.2\)\)/);
    });

    it('F1.4: defines .glass-pill and .glass-interactive classes with micro-state transitions', () => {
      assert.match(scssContent, /\.glass-pill\s*\{[^}]*background:\s*var\(--glass-pill-bg\)/);
      assert.match(scssContent, /\.glass-interactive\s*\{[^}]*transition:\s*all\s*140ms/);
      assert.match(scssContent, /transform:\s*scale\(0\.975\)/);
    });

    it('F1.5: enforces macOS 16px (rounded-2xl) and 24px (rounded-3xl) radius constraints in components and pills', () => {
      assert.match(scssContent, /\.glass-pill\s*\{[^}]*border-radius:\s*9999px/);
      const mainLayoutFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'MainLayout.tsx'), 'utf-8');
      assert.ok(mainLayoutFile.includes('rounded-2xl'));
      const cardFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'tracker', 'TrackerCard.tsx'), 'utf-8');
      assert.ok(cardFile.includes('rounded-2xl'));
      const presetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'PresetSelector.tsx'), 'utf-8');
      assert.ok(presetFile.includes('rounded-3xl'));
    });
  });

  // -------------------------------------------------------------
  // F2: SF Pro Typography & Interactive Polish
  // -------------------------------------------------------------
  describe('F2: SF Pro Typography & Interactive Polish', () => {
    const scssContent = fs.readFileSync(SCSS_PATH, 'utf-8');

    it('F2.1: sets system-native SF Pro font stack hierarchy on body', () => {
      assert.match(scssContent, /font-family:[^;]*'SF Pro Text',\s*'SF Pro Display',\s*'SF Pro'/);
    });

    it('F2.2: enables tabular-nums globally for jitter-free telemetry rendering', () => {
      assert.match(scssContent, /font-variant-numeric:\s*tabular-nums;/);
    });

    it('F2.3: enables subpixel antialiasing (-webkit-font-smoothing and -moz-osx-font-smoothing)', () => {
      assert.match(scssContent, /-webkit-font-smoothing:\s*antialiased;/);
      assert.match(scssContent, /-moz-osx-font-smoothing:\s*grayscale;/);
    });

    it('F2.4: sets tighter letter-spacing (-0.01em) for macOS utility typography', () => {
      assert.match(scssContent, /letter-spacing:\s*-0\.01em;/);
    });

    it('F2.5: applies active scale feedback (active:scale-[0.97] / active:scale-[0.98] / transform scale) on interactive buttons', () => {
      const topBarFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'QuestDiagnosticsPill.tsx'), 'utf-8');
      assert.ok(topBarFile.includes('active:scale-[0.97]'));
      const presetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'PresetSelector.tsx'), 'utf-8');
      assert.ok(presetFile.includes('active:scale-[0.97]'));
      assert.match(scssContent, /transform:\s*scale\(0\.975\)/);
    });
  });

  // -------------------------------------------------------------
  // F3: Minimal Single-Window Layout Grid
  // -------------------------------------------------------------
  describe('F3: Minimal Single-Window Layout Grid', () => {
    it('F3.1: defines complete grid area mapping (t, n, c, s, b) in MainLayout', () => {
      const layoutFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'MainLayout.tsx'), 'utf-8');
      assert.ok(layoutFile.includes("gridArea: 't'"));
      assert.ok(layoutFile.includes("gridArea: 'n'"));
      assert.ok(layoutFile.includes("gridArea: 'c'"));
      assert.ok(layoutFile.includes("gridArea: 's'"));
      assert.ok(layoutFile.includes("gridArea: 'b'"));
    });

    it('F3.2: calculates non-zero content width and height on standard 960x680 macOS window', () => {
      const dims = calculateLayoutDimensions(960, 680, false, true);
      assert.equal(dims.isMobile, false);
      assert.equal(dims.topbarHeight, 38);
      assert.equal(dims.navbarWidth, 110);
      assert.equal(dims.sidebarWidth, 320);
      assert.equal(dims.contentWidth, 960 - 110 - 320 - 16); // 514px
      assert.equal(dims.contentHeight, 680 - 38 - 16); // 626px
      assert.ok(dims.contentWidth > 400);
    });

    it('F3.3: adapts responsive grid down to compact 380x560 without horizontal void', () => {
      const dims = calculateLayoutDimensions(380, 560, false, false);
      assert.equal(dims.isMobile, true);
      assert.equal(dims.topbarHeight, 44);
      assert.equal(dims.navbarWidth, 0);
      assert.equal(dims.sidebarWidth, 0);
      assert.equal(dims.contentWidth, 380); // full width on mobile
      assert.equal(dims.contentHeight, 560 - 44 - 73); // 443px
      assert.ok(dims.contentWidth >= 380);
    });

    it('F3.4: handles ultra-wide 1920x1080 display while maintaining balanced sidebar bounds', () => {
      const dims = calculateLayoutDimensions(1920, 1080, false, true);
      assert.equal(dims.sidebarWidth, 380);
      assert.equal(dims.contentWidth, 1920 - 110 - 380 - 16); // 1414px
      assert.ok(dims.contentWidth > 1000);
    });

    it('F3.5: topbar height shifts dynamically between desktop (38px) and mobile (44px)', () => {
      const desktopDims = calculateLayoutDimensions(1024, 768, false, true);
      const mobileDims = calculateLayoutDimensions(480, 800, false, true);
      assert.equal(desktopDims.topbarHeight, 38);
      assert.equal(mobileDims.topbarHeight, 44);
    });
  });

  // -------------------------------------------------------------
  // F4: Collapsible Right Sidebar & 3D WebGL Drawer
  // -------------------------------------------------------------
  describe('F4: Collapsible Right Sidebar & 3D WebGL Drawer', () => {
    it('F4.1: calculates checklist drawer height (90px when collapsed vs calc(100% - 16px) when open)', () => {
      const totalH = 600;
      const collapsed = calculateSidebarHeights(totalH, true);
      const open = calculateSidebarHeights(totalH, false);

      assert.equal(collapsed.checklistHeight, 90);
      assert.equal(open.checklistHeight, 584); // 600 - 16
    });

    it('F4.2: calculates 3D visualizer preview drawer height (calc(100% - 114px) when open vs 0% when collapsed)', () => {
      const totalH = 600;
      const collapsed = calculateSidebarHeights(totalH, true);
      const open = calculateSidebarHeights(totalH, false);

      assert.equal(collapsed.previewHeight, 486); // 600 - 90 - 24
      assert.equal(open.previewHeight, 0);
    });

    it('F4.3: disables WebGL rendering when visualizer preview is closed/toggled', () => {
      const sidebarFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'Sidebar.tsx'), 'utf-8');
      assert.ok(sidebarFile.includes('disabled={disabledRender}'));
      assert.ok(sidebarFile.includes('SkeletonVisualizerWidget'));
    });

    it('F4.4: auto-collapses checklist when tracking completion state is complete', () => {
      const sidebarFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'Sidebar.tsx'), 'utf-8');
      assert.ok(sidebarFile.includes("if (completion === 'complete')"));
      assert.ok(sidebarFile.includes('setClosed(true)'));
    });

    it('F4.5: calculates and formats estimated height in centimeters with 1 decimal precision', () => {
      const height1 = formatEstimatedHeight(1.75);
      const height2 = formatEstimatedHeight(1.85);
      const invalid = formatEstimatedHeight(0);

      assert.equal(height1, '187.0 cm'); // (1.75 * 100) / 0.936 = 186.965 -> 187.0
      assert.equal(height2, '197.6 cm'); // (1.85 * 100) / 0.936 = 197.649 -> 197.6
      assert.equal(invalid, '');
    });
  });

  // -------------------------------------------------------------
  // F5: Variable Tracker Fleet (Card & Row Views)
  // -------------------------------------------------------------
  describe('F5: Variable Tracker Fleet (Card & Row Views)', () => {
    it('F5.1: renders TrackerCard grid when homeLayout is default', () => {
      const homeFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'Home.tsx'), 'utf-8');
      assert.ok(homeFile.includes("config?.homeLayout == 'default'"));
      assert.ok(homeFile.includes('<TrackerCard'));
    });

    it('F5.2: renders TrackersTable when homeLayout is table', () => {
      const homeFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'Home.tsx'), 'utf-8');
      assert.ok(homeFile.includes("config?.homeLayout === 'table'"));
      assert.ok(homeFile.includes('<TrackersTable'));
    });

    it('F5.3: layout switcher toggles between Card and Row view', () => {
      const homeFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'Home.tsx'), 'utf-8');
      assert.ok(homeFile.includes("toggleLayout = () => {"));
      assert.ok(homeFile.includes("config?.homeLayout === 'table' ? 'default' : 'table'"));
    });

    it('F5.4: computes shake highlight glow radius based on IMU velocity vector magnitude', () => {
      const zeroGlow = calculateShakeHighlightGlow(0);
      const gentleGlow = calculateShakeHighlightGlow(1.5);
      const fastGlow = calculateShakeHighlightGlow(5.0);
      const clampedGlow = calculateShakeHighlightGlow(100.0); // max clamp 50

      assert.equal(zeroGlow, 0);
      assert.equal(gentleGlow, 12); // Math.floor(1.5 * 8)
      assert.equal(fastGlow, 40); // Math.floor(5.0 * 8)
      assert.equal(clampedGlow, 400); // Math.floor(50 * 8)
    });

    it('F5.5: formats 3D Euler rotation vectors with configurable precision', () => {
      const rot: [number, number, number] = [45.123, -12.456, 179.99];
      const standard = formatEulerVector(rot, 0);
      const precise = formatEulerVector(rot, 2);

      assert.equal(standard, '45°, -12°, 180°');
      assert.equal(precise, '45.12°, -12.46°, 179.99°');
    });
  });

  // -------------------------------------------------------------
  // F6: Multi-Attribute Health Pills & Badges
  // -------------------------------------------------------------
  describe('F6: Multi-Attribute Health Pills & Badges', () => {
    it('F6.1: formats battery percentage, voltage, and runtime estimation', () => {
      const full = getBatteryStatus({
        batteryPctEstimate: 98,
        batteryVoltage: 4.18,
        batteryRuntimeEstimate: 3600 * 8.5, // 8h 30m
      });
      assert.equal(full.pctFormatted, '98%');
      assert.equal(full.voltageFormatted, '4.18 V');
      assert.equal(full.runtimeFormatted, '8h 30m');
      assert.equal(full.level, 'full');
      assert.equal(full.isDisabled, false);
    });

    it('F6.2: evaluates critical low battery level threshold (< 10%)', () => {
      const critical = getBatteryStatus({
        batteryPctEstimate: 7,
        batteryVoltage: 3.42,
        batteryRuntimeEstimate: 900,
      });
      assert.equal(critical.pctFormatted, '7%');
      assert.equal(critical.level, 'critical');
    });

    it('F6.3: handles missing hardware battery telemetry with fallback placeholders', () => {
      const empty = getBatteryStatus(undefined);
      assert.equal(empty.pctFormatted, '--');
      assert.equal(empty.voltageFormatted, '--');
      assert.equal(empty.runtimeFormatted, '--');
      assert.equal(empty.isDisabled, true);
    });

    it('F6.4: supports warning badges on tracker cards and table rows', () => {
      const cardFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'tracker', 'TrackerCard.tsx'), 'utf-8');
      assert.ok(cardFile.includes('border-status-warning'));
      assert.ok(cardFile.includes('WarningIcon'));
    });

    it('F6.5: disables battery and wifi sub-components when tracker status is disconnected', () => {
      const cardFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'tracker', 'TrackerCard.tsx'), 'utf-8');
      assert.ok(cardFile.includes('disabled={tracker.status === TrackerStatusEnum.DISCONNECTED}'));
    });
  });

  // -------------------------------------------------------------
  // F7: Header Quick Presets & Quest Diagnostics
  // -------------------------------------------------------------
  describe('F7: Header Quick Presets & Quest Diagnostics', () => {
    it('F7.1: displays active preset name with sparkle indicator in PresetSelector', () => {
      const presetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'PresetSelector.tsx'), 'utf-8');
      assert.ok(presetFile.includes('✦'));
      assert.ok(presetFile.includes('{activePreset.name}'));
    });

    it('F7.2: supports preset selection and switching via setActivePresetId', () => {
      const presetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'PresetSelector.tsx'), 'utf-8');
      assert.ok(presetFile.includes('setActivePresetId(preset.id)'));
      assert.ok(presetFile.includes('presets.map'));
    });

    it('F7.3: includes Manage Presets modal with creation dialog', () => {
      const presetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'PresetSelector.tsx'), 'utf-8');
      assert.ok(presetFile.includes('Manage Tracker Presets'));
      assert.ok(presetFile.includes('createPreset'));
    });

    it('F7.4: evaluates Quest OSC diagnostics status pill colors based on connection and active hardware', () => {
      const disconnected = evaluateQuestDiagnostics(false, 0);
      const idle = evaluateQuestDiagnostics(true, 0);
      const active = evaluateQuestDiagnostics(true, 6);

      assert.equal(disconnected.statusColor, 'bg-status-critical');
      assert.equal(disconnected.statusText, 'Backend Disconnected');
      assert.equal(disconnected.oscReady, false);

      assert.equal(idle.statusColor, 'bg-status-warning');
      assert.equal(idle.statusText, '0 Trackers Active');
      assert.equal(idle.oscReady, true);

      assert.equal(active.statusColor, 'bg-status-success');
      assert.equal(active.statusText, '6 Trackers Active');
      assert.equal(active.oscReady, true);
    });

    it('F7.5: Quest diagnostics popover provides Quest/VRChat OSC Port 9000 readiness info', () => {
      const diagFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'QuestDiagnosticsPill.tsx'), 'utf-8');
      assert.ok(diagFile.includes('Quest / VRChat OSC:'));
      assert.ok(diagFile.includes('Ready / Port 9000'));
      assert.ok(diagFile.includes('System Diagnostics'));
    });
  });

  // -------------------------------------------------------------
  // F8: Guarded Calibration & Reset Shortcuts
  // -------------------------------------------------------------
  describe('F8: Guarded Calibration & Reset Shortcuts', () => {
    it('F8.1: supports Yaw, Full, and Mounting reset types with specific icon mappings', () => {
      const resetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'ResetButton.tsx'), 'utf-8');
      assert.ok(resetFile.includes('ResetType.Yaw'));
      assert.ok(resetFile.includes('ResetType.Full'));
      assert.ok(resetFile.includes('ResetType.Mounting'));
      assert.ok(resetFile.includes('SkiIcon'));
      assert.ok(resetFile.includes('FootIcon'));
    });

    it('F8.2: Full Reset executes timed countdown with progress tracking', () => {
      let completed = false;
      const controller = new ResetCountdownController(3, () => {
        completed = true;
      });

      const triggered = controller.trigger(false);
      assert.equal(triggered, true);
      assert.equal(controller.getStatus().status, 'counting');

      // Tick 1
      const tick1 = controller.tick();
      assert.equal(tick1.timer, 2);
      assert.equal(tick1.finished, false);
      assert.ok(tick1.progress > 0.3 && tick1.progress < 0.35);

      // Tick 2
      const tick2 = controller.tick();
      assert.equal(tick2.timer, 1);
      assert.equal(tick2.finished, false);

      // Tick 3 (Final)
      const tick3 = controller.tick();
      assert.equal(tick3.timer, 0);
      assert.equal(tick3.progress, 1.0);
      assert.equal(tick3.finished, true);
      assert.equal(completed, true);
      assert.equal(controller.getStatus().status, 'finished');
    });

    it('F8.3: Yaw Reset triggers immediately without countdown delay (duration = 0)', () => {
      let completed = false;
      const controller = new ResetCountdownController(0, () => {
        completed = true;
      });

      const triggered = controller.trigger(false);
      assert.equal(triggered, true);
      assert.equal(completed, true);
      assert.equal(controller.getStatus().status, 'finished');
    });

    it('F8.4: Server guard locks block reset triggering and set error state with tooltip message', () => {
      let failed = false;
      const controller = new ResetCountdownController(3, undefined, () => {
        failed = true;
      });

      const triggered = controller.trigger(true, 'reset-error-trackers_not_ready');
      assert.equal(triggered, false);
      assert.equal(failed, true);
      const status = controller.getStatus();
      assert.equal(status.status, 'error');
      assert.equal(status.error, 'reset-error-trackers_not_ready');
    });

    it('F8.5: Reset button reflects finished state with green border styling', () => {
      const resetFile = fs.readFileSync(path.join(GUI_ROOT, 'src', 'components', 'home', 'ResetButton.tsx'), 'utf-8');
      assert.ok(resetFile.includes("status === 'finished'"));
      assert.ok(resetFile.includes('border-status-success'));
    });
  });
});
