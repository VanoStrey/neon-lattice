import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Sparkles,
  Trash2,
  Sliders,
  Paintbrush,
  Zap,
  Gauge,
} from 'lucide-react';
import { BrushMode, SimulationState } from '../types/simulation';

interface ControlPanelProps {
  state: SimulationState;
  onTogglePlay: () => void;
  onStepOnce: () => void;
  onClear: () => void;
  onPerturb: () => void;
  onResetPreset: () => void;
  onUpdateParams: (params: Partial<SimulationState>) => void;
  onToggleWallpaper: () => void;
  onToggleZen: () => void;
  onActivateWallpaperPreset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  onTogglePlay,
  onStepOnce,
  onClear,
  onPerturb,
  onResetPreset,
  onUpdateParams,
  onToggleWallpaper,
  onToggleZen,
  onActivateWallpaperPreset,
}) => {
  const brushModes: { mode: BrushMode; label: string; icon: string }[] = [
    { mode: 'inject_v', label: 'Inject V', icon: '🧬' },
    { mode: 'erase', label: 'Inhibit / Erase', icon: '🧼' },
    { mode: 'pulse', label: 'Pulse Wave', icon: '💥' },
    { mode: 'vortex', label: 'Turbulent Swirl', icon: '🌀' },
  ];

  return (
    <div className="space-y-4 text-neutral-200">
      {/* Live Wallpaper & Zen Mode Feature Card */}
      <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-neutral-900/60 to-fuchsia-950/30 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-cyan-300 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>macOS Live Wallpaper Mode</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
            Auto-Drift
          </span>
        </div>

        <p className="text-[11px] text-neutral-400 leading-tight">
          Автономные агенты мягко скользят по экрану и возбуждают нежные киберпанк-волны без резких розовых вспышек.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onToggleWallpaper}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              state.isWallpaperMode
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-neutral-800/80 text-neutral-300 border border-neutral-700 hover:border-cyan-500/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${state.isWallpaperMode ? 'bg-cyan-400 animate-ping' : 'bg-neutral-500'}`} />
            <span>{state.isWallpaperMode ? 'Авто-дрейф: ВКЛ' : 'Включить Авто-дрейф (W)'}</span>
          </button>

          <button
            onClick={onActivateWallpaperPreset}
            title="Загрузить пресет Турбулентности + Киберпанк + Авто-дрейф"
            className="px-3 py-2 rounded-lg bg-fuchsia-950/50 hover:bg-fuchsia-900/50 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-semibold cursor-pointer transition-all"
          >
            Пресет Обоев
          </button>

          <button
            onClick={onToggleZen}
            title="Полноэкранный режим без панелей (Z)"
            className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold cursor-pointer transition-all"
          >
            Zen (Z)
          </button>
        </div>
      </div>

      {/* Simulation Master Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-lg ${
            state.isRunning
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
          }`}
        >
          {state.isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </>
          )}
        </button>

        <button
          onClick={onStepOnce}
          disabled={state.isRunning}
          title="Step single simulation cycle"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700/60 hover:border-neutral-500 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <StepForward className="w-3.5 h-3.5 text-cyan-400" />
          <span>Step</span>
        </button>

        <button
          onClick={onPerturb}
          title="Inject random micro-disturbances"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700/60 hover:border-cyan-500/60 text-xs font-medium hover:text-cyan-300 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Perturb</span>
        </button>

        <button
          onClick={onResetPreset}
          title="Re-seed current preset"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700/60 hover:border-neutral-500 text-xs font-medium cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
          <span>Re-Seed</span>
        </button>

        <button
          onClick={onClear}
          title="Wipe grid clean"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700/60 hover:border-rose-500/60 text-xs font-medium hover:text-rose-300 cursor-pointer ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Clear</span>
        </button>
      </div>

      {/* Brush & Interaction Toolkit */}
      <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-neutral-300 uppercase">
            <Paintbrush className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Injection Brush</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Click & drag on canvas</span>
        </div>

        {/* Brush Mode Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {brushModes.map((b) => {
            const active = state.brushMode === b.mode;
            return (
              <button
                key={b.mode}
                onClick={() => onUpdateParams({ brushMode: b.mode })}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  active
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <span>{b.icon}</span>
                <span className="truncate">{b.label}</span>
              </button>
            );
          })}
        </div>

        {/* Brush Radius & Strength Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Radius</span>
              <span className="text-cyan-400 font-bold">{state.brushRadius}px</span>
            </div>
            <input
              type="range"
              min="4"
              max="64"
              step="1"
              value={state.brushRadius}
              onChange={(e) => onUpdateParams({ brushRadius: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Intensity</span>
              <span className="text-cyan-400 font-bold">{Math.round(state.brushStrength * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={state.brushStrength}
              onChange={(e) => onUpdateParams({ brushStrength: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Physics Engine & Reaction Rates */}
      <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-neutral-300 uppercase">
            <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Differential Reaction-Diffusion Kinematics</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-fuchsia-400 font-mono">
            <Zap className="w-3 h-3" />
            <span>Substeps: {state.substeps}x</span>
          </div>
        </div>

        {/* Speed / Substeps */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" /> Simulation Substeps per Frame
            </span>
            <span className="text-cyan-400 font-bold">{state.substeps} ticks/frame</span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            step="1"
            value={state.substeps}
            onChange={(e) => onUpdateParams({ substeps: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
          />
        </div>

        {/* Reaction Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Feed Rate F */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Feed Rate (F)</span>
              <span className="text-fuchsia-400 font-bold">{state.feed.toFixed(4)}</span>
            </div>
            <input
              type="range"
              min="0.0100"
              max="0.0900"
              step="0.0005"
              value={state.feed}
              onChange={(e) => onUpdateParams({ feed: Number(e.target.value) })}
              className="w-full accent-fuchsia-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          {/* Kill Rate k */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Kill Rate (k)</span>
              <span className="text-fuchsia-400 font-bold">{state.kill.toFixed(4)}</span>
            </div>
            <input
              type="range"
              min="0.0400"
              max="0.0750"
              step="0.0005"
              value={state.kill}
              onChange={(e) => onUpdateParams({ kill: Number(e.target.value) })}
              className="w-full accent-fuchsia-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          {/* Diffusion U */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Diffusion U (Dᵤ)</span>
              <span className="text-neutral-200 font-bold">{state.diffU.toFixed(4)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.35"
              step="0.005"
              value={state.diffU}
              onChange={(e) => onUpdateParams({ diffU: Number(e.target.value) })}
              className="w-full accent-neutral-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          {/* Diffusion V */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Diffusion V (Dᵥ)</span>
              <span className="text-neutral-200 font-bold">{state.diffV.toFixed(4)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.20"
              step="0.005"
              value={state.diffV}
              onChange={(e) => onUpdateParams({ diffV: Number(e.target.value) })}
              className="w-full accent-neutral-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
