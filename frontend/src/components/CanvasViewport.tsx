import React, { useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, Sparkles } from 'lucide-react';
import { BrushMode } from '../types/simulation';

interface CanvasViewportProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isRunning: boolean;
  brushRadius: number;
  brushMode: BrushMode;
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  };
  onPerturb: () => void;
  onTogglePlay: () => void;
  isWallpaperMode?: boolean;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  canvasRef,
  isRunning,
  brushRadius,
  brushMode,
  handlers,
  onPerturb,
  onTogglePlay,
  isWallpaperMode = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const getBrushModeColor = () => {
    switch (brushMode) {
      case 'inject_v':
        return 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,240,255,0.4)]';
      case 'erase':
        return 'border-rose-400 bg-rose-400/10 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
      case 'pulse':
        return 'border-amber-400 bg-amber-400/15 shadow-[0_0_15px_rgba(251,191,36,0.5)]';
      case 'vortex':
        return 'border-fuchsia-400 bg-fuchsia-400/15 shadow-[0_0_15px_rgba(217,70,239,0.5)]';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl transition-all ${
        isFullscreen ? 'w-screen h-screen bg-black' : 'w-full aspect-[16/10] max-w-[760px] mx-auto'
      }`}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerLeave={() => setCursorPos(null)}
    >
      {/* 640x400 Native Simulation Canvas (16:10 MacBook Retina native ratio) */}
      <canvas
        ref={canvasRef}
        width={640}
        height={400}
        className="simulation-canvas w-full h-full object-contain cursor-crosshair touch-none select-none block"
        {...handlers}
      />

      {/* Floating Interactive Brush Reticle */}
      {cursorPos && (
        <div
          className={`pointer-events-none absolute rounded-full border border-dashed transition-transform duration-75 -translate-x-1/2 -translate-y-1/2 ${getBrushModeColor()}`}
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            width: `${brushRadius * 2}px`,
            height: `${brushRadius * 2}px`,
          }}
        />
      )}

      {/* Paused Watermark */}
      {!isRunning && (
        <button
          onClick={onTogglePlay}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 border border-rose-500/40 text-rose-300 backdrop-blur-md text-xs font-mono font-bold animate-pulse cursor-pointer hover:bg-rose-950/60 transition-colors"
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>PAUSED (CLICK TO RESUME)</span>
        </button>
      )}

      {/* Live Wallpaper Drift Badge */}
      {isRunning && isWallpaperMode && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 border border-cyan-500/40 text-cyan-300 backdrop-blur-md text-[10px] font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>AUTONOMOUS DRIFT</span>
        </div>
      )}

      {/* Top Right Quick Actions Overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          title={isRunning ? 'Pause (Space)' : 'Resume (Space)'}
          className="p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-300 border border-neutral-700/60 backdrop-blur-md cursor-pointer transition-colors shadow-lg"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current text-emerald-400" />}
        </button>

        <button
          onClick={onPerturb}
          title="Micro-Perturbation (P)"
          className="p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-300 border border-neutral-700/60 backdrop-blur-md cursor-pointer transition-colors shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-300 border border-neutral-700/60 backdrop-blur-md cursor-pointer transition-colors shadow-lg"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Keyboard Hint Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 border border-neutral-800 backdrop-blur-md text-[10px] font-mono text-neutral-400 hidden sm:flex items-center gap-3 pointer-events-none">
        <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-200">Space</kbd> Play/Pause</span>
        <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-200">R</kbd> Re-seed</span>
        <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-200">P</kbd> Perturb</span>
        <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-200">C</kbd> Clear</span>
        <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-200">1-8</kbd> Presets</span>
      </div>
    </div>
  );
};
