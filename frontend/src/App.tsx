import React, { useEffect } from 'react';
import { Terminal, Cpu, ShieldCheck } from 'lucide-react';
import { useLatticeSimulation } from './hooks/useLatticeSimulation';
import { CanvasViewport } from './components/CanvasViewport';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryHUD } from './components/TelemetryHUD';
import { PresetSelector } from './components/PresetSelector';
import { PaletteSelector } from './components/PaletteSelector';

export const App: React.FC = () => {
  const {
    canvasRef,
    isReady,
    error,
    state,
    telemetry,
    handlers,
    actions,
  } = useLatticeSimulation();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        actions.togglePlayPause();
      } else if (e.key === 'r' || e.key === 'R') {
        actions.selectPreset(state.presetId);
      } else if (e.key === 'p' || e.key === 'P') {
        actions.perturbGrid(12);
      } else if (e.key === 'c' || e.key === 'C') {
        actions.clearGrid();
      } else if (e.key === 'w' || e.key === 'W') {
        actions.toggleWallpaperMode();
      } else if (e.key === 'z' || e.key === 'Z') {
        actions.toggleZenMode();
      } else if (e.key === 'Escape' && state.isZenMode) {
        actions.toggleZenMode();
      } else if (e.key >= '1' && e.key <= '8') {
        const id = parseInt(e.key, 10) - 1;
        actions.selectPreset(id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, state.presetId, state.isZenMode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4 text-center">
        <div className="max-w-md p-6 rounded-2xl glass-panel border-rose-500/40 text-rose-300 space-y-3">
          <Terminal className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold tracking-tight">WASM Kernel Boot Failure</h2>
          <p className="text-xs text-rose-200/70 font-mono">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
          >
            Re-initialize Engine
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050608] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-sm font-bold tracking-widest text-cyan-300 font-mono uppercase">
            NEON-LATTICE KERNEL BOOT
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Compiling SIMD / Zero-Copy 640×400 (16:10) Linear Memory Buffers...
          </p>
        </div>
      </div>
    );
  }

  // Pure Zen / Wallpaper Fullscreen View
  if (state.isZenMode) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#050608] overflow-hidden flex items-center justify-center select-none">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="simulation-canvas w-full h-full object-cover cursor-crosshair touch-none"
          {...handlers}
        />

        {/* Floating Minimal Zen Overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={actions.toggleZenMode}
            className="px-3.5 py-1.5 rounded-lg bg-black/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 backdrop-blur-md text-xs font-mono cursor-pointer transition-colors shadow-2xl"
          >
            Exit Zen Mode (Esc / Z)
          </button>
        </div>

        {/* Minimal Bottom Telemetry & Drift status */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 border border-cyan-500/30 backdrop-blur-md text-[11px] font-mono text-neutral-300 flex items-center gap-3.5 shadow-2xl">
          <span className="text-cyan-400 flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Live Wallpaper Mode {state.isWallpaperMode ? '(Active)' : '(Paused)'}
          </span>
          <span className="text-neutral-500">&bull;</span>
          <span>{telemetry.fps} FPS</span>
          <span className="text-neutral-500">&bull;</span>
          <span>Rust {telemetry.wasmComputeTimeMs}ms</span>
          <span className="text-neutral-500">&bull;</span>
          <span className="text-neutral-400 hidden sm:inline">Press Z or Esc to return</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050608] text-neutral-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Cybernetic App Bar */}
      <header className="sticky top-0 z-30 border-b border-cyan-500/15 bg-neutral-950/80 backdrop-blur-xl px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="text-base font-black">🧬</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                  NEON-LATTICE
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  v0.1.0-WASM
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-tight">
                Reaction-Diffusion & Cellular Automata Engine
              </p>
            </div>
          </div>

          {/* Real-time Telemetry HUD in Top Bar */}
          <TelemetryHUD telemetry={telemetry} isRunning={state.isRunning} />
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Canvas Viewport & Engine Diagnostics */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          <CanvasViewport
            canvasRef={canvasRef}
            isRunning={state.isRunning}
            brushRadius={state.brushRadius}
            brushMode={state.brushMode}
            isWallpaperMode={state.isWallpaperMode}
            handlers={handlers}
            onPerturb={() => actions.perturbGrid(12)}
            onTogglePlay={actions.togglePlayPause}
          />

          {/* Architecture Highlights Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-neutral-800 bg-neutral-900/40 text-[11px] font-mono text-neutral-400">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bounds Check Elimination (BCE)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Toroidal Wraps (Native 16:10 Grid)</span>
            </div>
            <div className="flex items-center gap-1.5 text-fuchsia-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Zero-Allocation Loop</span>
            </div>
          </div>
        </section>

        {/* Right Column: Cybernetic Control Dock */}
        <aside className="lg:col-span-5 flex flex-col space-y-5 glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/20">
          {/* Archetypal Presets */}
          <PresetSelector
            currentPresetId={state.presetId}
            onSelectPreset={actions.selectPreset}
          />

          {/* Color Palettes */}
          <PaletteSelector
            currentPaletteId={state.paletteId}
            onSelectPalette={actions.selectPalette}
          />

          {/* Interactive Controls & Parameters */}
          <ControlPanel
            state={state}
            onTogglePlay={actions.togglePlayPause}
            onStepOnce={actions.stepOnce}
            onClear={actions.clearGrid}
            onPerturb={() => actions.perturbGrid(12)}
            onResetPreset={() => actions.selectPreset(state.presetId)}
            onUpdateParams={actions.updateParameters}
            onToggleWallpaper={actions.toggleWallpaperMode}
            onToggleZen={actions.toggleZenMode}
            onActivateWallpaperPreset={actions.activateWallpaperPreset}
          />
        </aside>
      </main>

      {/* Cybernetic Footer */}
      <footer className="border-t border-neutral-800/80 py-3 px-6 text-center text-xs text-neutral-500 font-mono">
        NEON-LATTICE &bull; Pure Rust Core + WebAssembly Zero-Copy Buffer &bull; React 19 + Vite + Tailwind v4
      </footer>
    </div>
  );
};
