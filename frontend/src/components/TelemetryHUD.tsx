import React from 'react';
import { Activity, Cpu, Layers, HardDrive } from 'lucide-react';
import { SimulationTelemetry } from '../types/simulation';

interface TelemetryHUDProps {
  telemetry: SimulationTelemetry;
  isRunning: boolean;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry, isRunning }) => {
  const fpsColor =
    telemetry.fps >= 55
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
      : telemetry.fps >= 30
      ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
      : 'text-rose-400 border-rose-500/30 bg-rose-950/20';

  const activePercent = ((telemetry.activeCells / 262144) * 100).toFixed(1);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
      {/* FPS & Status Indicator */}
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border backdrop-blur-md ${fpsColor}`}>
        <span className="relative flex h-2 w-2">
          {isRunning && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isRunning ? 'bg-emerald-500' : 'bg-neutral-500'
            }`}
          ></span>
        </span>
        <span className="font-bold tracking-wider">{telemetry.fps} FPS</span>
      </div>

      {/* Rust Compute Duration */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-cyan-500/20 bg-neutral-900/60 backdrop-blur-md text-cyan-300">
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-neutral-400">RUST:</span>
        <span className="font-semibold text-cyan-200">{telemetry.wasmComputeTimeMs}ms</span>
      </div>

      {/* Living Active Cells */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-fuchsia-500/20 bg-neutral-900/60 backdrop-blur-md text-fuchsia-300">
        <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
        <span className="text-neutral-400">ACTIVE:</span>
        <span className="font-semibold text-fuchsia-200">
          {telemetry.activeCells.toLocaleString()} <span className="text-[10px] text-fuchsia-400/70">({activePercent}%)</span>
        </span>
      </div>

      {/* Step Counter */}
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-neutral-700/50 bg-neutral-900/60 backdrop-blur-md text-neutral-300">
        <Layers className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-400">TICKS:</span>
        <span className="font-semibold text-neutral-200">{telemetry.stepCounter.toLocaleString()}</span>
      </div>

      {/* Memory Architecture */}
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/20 bg-neutral-900/60 backdrop-blur-md text-emerald-300">
        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-neutral-400">SHARED:</span>
        <span className="font-semibold text-emerald-200">1.05MB ZERO-COPY</span>
      </div>
    </div>
  );
};
