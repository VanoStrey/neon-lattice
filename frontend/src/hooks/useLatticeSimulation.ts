import { useEffect, useRef, useState, useCallback } from 'react';
import init, { LatticeWasm, InitOutput } from '../pkg/lattice_wasm';
import {
  PRESETS,
  SimulationState,
  SimulationTelemetry,
} from '../types/simulation';

interface DriftAgent {
  x: number;
  y: number;
  gvx: number;
  gvy: number;
  angle: number;
  angularVelocity: number;
  targetAngularVelocity: number;
  baseSpeed: number;
  radius: number;
  targetRadius: number;
  arcTimer: number;
  arcDuration: number;
}

export function useLatticeSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latticeRef = useRef<LatticeWasm | null>(null);
  const wasmOutputRef = useRef<InitOutput | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);

  // Autonomous wallpaper drift agents: base random long arcs + dynamic coverage breathing + layered N-body gravity
  const driftAgentsRef = useRef<DriftAgent[]>([
    { x: 320, y: 200, gvx: 0, gvy: 0, angle: 0.75, angularVelocity: 0, targetAngularVelocity: 0.002, baseSpeed: 0.42, radius: 20, targetRadius: 20, arcTimer: 0, arcDuration: 360 },
    { x: 160, y: 300, gvx: 0, gvy: 0, angle: 2.30, angularVelocity: 0, targetAngularVelocity: -0.003, baseSpeed: 0.36, radius: 36, targetRadius: 36, arcTimer: 120, arcDuration: 420 },
    { x: 480, y: 100, gvx: 0, gvy: 0, angle: 4.10, angularVelocity: 0, targetAngularVelocity: 0.003, baseSpeed: 0.39, radius: 14, targetRadius: 14, arcTimer: 240, arcDuration: 480 },
  ]);
  const wallpaperTickRef = useRef(0);

  // Ready and loading states
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation parameters
  const [state, setState] = useState<SimulationState>({
    isRunning: true,
    isWallpaperMode: false,
    isZenMode: false,
    presetId: 0,
    paletteId: 0,
    substeps: 6,
    feed: PRESETS[0].feed,
    kill: PRESETS[0].kill,
    diffU: PRESETS[0].diffU,
    diffV: PRESETS[0].diffV,
    dt: 1.0,
    brushRadius: 18,
    brushStrength: 0.9,
    brushMode: 'inject_v',
  });

  // State ref for high-frequency access in animation loop
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Telemetry state
  const [telemetry, setTelemetry] = useState<SimulationTelemetry>({
    fps: 60,
    wasmComputeTimeMs: 0.5,
    activeCells: 15420,
    stepCounter: 0,
    meanV: 0.05,
    totalMemoryBytes: 1024000,
  });

  // FPS tracking refs
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const smoothedComputeTimeRef = useRef(0.5);

  // Initialize WASM
  useEffect(() => {
    let active = true;

    async function bootstrapWasm() {
      try {
        const wasmOutput = await init();
        if (!active) return;

        wasmOutputRef.current = wasmOutput;
        const lattice = new LatticeWasm();
        latticeRef.current = lattice;

        // Apply initial preset parameters
        const defaultPreset = PRESETS[0];
        lattice.set_parameters(
          defaultPreset.feed,
          defaultPreset.kill,
          defaultPreset.diffU,
          defaultPreset.diffV,
          1.0
        );
        lattice.load_preset(defaultPreset.id);

        setIsReady(true);
      } catch (err: unknown) {
        if (!active) return;
        console.error('WASM initialization error:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    bootstrapWasm();

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (latticeRef.current) {
        latticeRef.current.free();
        latticeRef.current = null;
      }
    };
  }, []);

  // Main high-performance render and simulation loop
  useEffect(() => {
    if (!isReady || !latticeRef.current || !wasmOutputRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const lattice = latticeRef.current;
    const wasmMem = wasmOutputRef.current.memory;
    const ptr = lattice.get_frame_buffer_ptr();
    const len = lattice.get_frame_buffer_len();

    let isSubscribed = true;

    const loop = (timestamp: number) => {
      if (!isSubscribed) return;

      const currentState = stateRef.current;
      let computeDuration = 0;

      if (currentState.isRunning) {
        const tStart = performance.now();

        // 0. Autonomous Wallpaper Drift Simulation:
        // Newtonian N-body gravitational physics with Slingshot maneuvers (+90% boost) & anti-sticking core
        if (currentState.isWallpaperMode) {
          const activeCells = lattice.get_active_cells();
          const coverage = Math.min(1.0, Math.max(0.0, activeCells / (256000 * 0.40)));
          const agents = driftAgentsRef.current;

          // 1. Procedural steering and dynamic radius breathing within mass tiers (pure base motion)
          for (const agent of agents) {
            agent.arcTimer++;
            if (agent.arcTimer >= agent.arcDuration) {
              agent.arcTimer = 0;
              agent.arcDuration = 360 + Math.floor(Math.random() * 420);

              if (Math.random() < 0.35) {
                agent.targetAngularVelocity = (Math.random() - 0.5) * 0.002;
              } else {
                const sign = Math.random() > 0.5 ? 1 : -1;
                agent.targetAngularVelocity = sign * (0.0015 + Math.random() * 0.0045);
              }

              // Dynamic radius range proportional to active colored cells ratio (10px -> 50px)
              const minR = 10.0;
              const maxR = 18.0 + coverage * 32.0; // scales from 18px up to 50px
              agent.targetRadius = minR + Math.random() * (maxR - minR);
            }

            // High inertial steering momentum — angle evolutions are never overwritten
            agent.angularVelocity = agent.angularVelocity * 0.985 + agent.targetAngularVelocity * 0.015;
            agent.angle += agent.angularVelocity;
            agent.radius = agent.radius * 0.990 + agent.targetRadius * 0.010;
          }

          // 2. Gravitational N-body interaction (Newton's 3rd Law: F_ij = -F_ji)
          const G = 2.5; // Scaled for browser coordinate space & baseSpeed ~0.4
          const epsilonSq = 144.0;
          const kRepel = 0.06;
          const maxBoostMultiplier = 1.90; // +90% boost
          const minSpeedMultiplier = 0.60;

          const forces = agents.map(() => ({ fx: 0, fy: 0 }));

          for (let i = 0; i < agents.length; i++) {
            const mi = Math.max(0.5, Math.pow(agents[i].radius / 16.0, 2));
            for (let j = i + 1; j < agents.length; j++) {
              const mj = Math.max(0.5, Math.pow(agents[j].radius / 16.0, 2));

              let dx = agents[j].x - agents[i].x;
              let dy = agents[j].y - agents[i].y;

              // Toroidal shortest displacement across 640x400 lattice
              if (dx > 320) dx -= 640;
              else if (dx < -320) dx += 640;
              if (dy > 200) dy -= 400;
              else if (dy < -200) dy += 400;

              const dSq = dx * dx + dy * dy;
              const d = Math.sqrt(dSq);
              const rSum = agents[i].radius + agents[j].radius;
              const rInfluence = rSum * 2.8;

              let fxTotal = 0;
              let fyTotal = 0;

              if (d < rInfluence && d > 0.001) {
                const ux = dx / d;
                const uy = dy / d;

                // Smooth cubic Hermite fade at boundary
                const s = Math.max(0.0, Math.min(1.0, (rInfluence - d) / (rInfluence - rSum * 0.7)));
                const fade = s * s * (3.0 - 2.0 * s);

                // Gravitational attraction
                const denom = Math.pow(dSq + epsilonSq, 1.5);
                const fGravMag = (G * (mi * mj) / denom) * fade;

                // Anti-sticking elastic repulsion core
                let fRepelMag = 0;
                if (d < rSum) {
                  fRepelMag = kRepel * (rSum - d);
                }

                const fNet = fGravMag - fRepelMag;
                fxTotal = ux * fNet;
                fyTotal = uy * fNet;
              }

              // Newton's 3rd Law: action and reaction are equal and opposite
              forces[i].fx += fxTotal;
              forces[i].fy += fyTotal;
              forces[j].fx -= fxTotal;
              forces[j].fy -= fyTotal;
            }
          }

          // 3. Layered movement: base long arc velocity + decaying gravitational perturbation
          for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            const mi = Math.max(0.5, Math.pow(agent.radius / 16.0, 2));
            const ax = forces[i].fx / mi;
            const ay = forces[i].fy / mi;

            // Gravitational velocity decays (tau ~ 40 frames ~ 0.7s) + accumulates acceleration
            agent.gvx = agent.gvx * 0.972 + ax;
            agent.gvy = agent.gvy * 0.972 + ay;

            // Pure base velocity from the long random arc
            const bvx = Math.cos(agent.angle) * agent.baseSpeed;
            const bvy = Math.sin(agent.angle) * agent.baseSpeed;

            // Total velocity is layered on top
            let totalVx = bvx + agent.gvx;
            let totalVy = bvy + agent.gvy;

            const speed = Math.sqrt(totalVx * totalVx + totalVy * totalVy);
            const maxSpeed = agent.baseSpeed * maxBoostMultiplier;
            const minSpeed = agent.baseSpeed * minSpeedMultiplier;

            if (speed > maxSpeed) {
              const scale = maxSpeed / speed;
              totalVx *= scale;
              totalVy *= scale;
              agent.gvx = totalVx - bvx;
              agent.gvy = totalVy - bvy;
            } else if (speed < minSpeed && speed > 0.001) {
              const scale = minSpeed / speed;
              totalVx *= scale;
              totalVy *= scale;
            }

            // Toroidal coordinate integration
            agent.x = (agent.x + totalVx + 640) % 640;
            agent.y = (agent.y + totalVy + 400) % 400;

            // Chemical injection
            const radiusScale = Math.min(1.15, Math.max(0.70, Math.pow(16.0 / agent.radius, 0.25)));
            const amountV = 0.27 * radiusScale * currentState.brushStrength;
            const amountU = -0.11 * radiusScale * currentState.brushStrength;

            lattice.inject_chemical(
              Math.round(agent.x),
              Math.round(agent.y),
              Math.round(agent.radius),
              amountV,
              amountU
            );
          }

          // Gentle ambient pulse every ~600 frames
          wallpaperTickRef.current = (wallpaperTickRef.current + 1) % 600;
          if (wallpaperTickRef.current === 0) {
            lattice.perturb_soft(2, 0.24, -0.10);
          }
        }

        // 1. Step simulation in Rust core
        lattice.step(currentState.substeps);

        // 2. Render color palette into linear frame buffer
        lattice.render_pixels(currentState.paletteId);

        const tEnd = performance.now();
        computeDuration = tEnd - tStart;
      } else {
        // When paused, still update palette if it was changed
        lattice.render_pixels(currentState.paletteId);
      }

      // 3. Zero-Copy Blit: wrap WASM linear memory into ImageData without copying (640x400 16:10)
      const pixelArray = new Uint8ClampedArray(wasmMem.buffer, ptr, len);
      const imgData = new ImageData(pixelArray, 640, 400);
      ctx.putImageData(imgData, 0, 0);

      // 4. Update Telemetry metrics
      frameCountRef.current++;
      smoothedComputeTimeRef.current =
        smoothedComputeTimeRef.current * 0.9 + computeDuration * 0.1;

      const elapsed = timestamp - lastFpsTimeRef.current;
      if (elapsed >= 200) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = timestamp;

        setTelemetry({
          fps: Math.min(currentFps, 120),
          wasmComputeTimeMs: Number(smoothedComputeTimeRef.current.toFixed(2)),
          activeCells: lattice.get_active_cells(),
          stepCounter: Number(lattice.get_step_counter()),
          meanV: Number(lattice.get_mean_v().toFixed(4)),
          totalMemoryBytes: len,
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isReady]);

  // Apply brush injection at a specific coordinate
  const applyBrushAt = useCallback((x: number, y: number) => {
    const lattice = latticeRef.current;
    if (!lattice) return;

    const { brushMode, brushRadius, brushStrength } = stateRef.current;
    const clampedX = Math.max(0, Math.min(639, Math.round(x)));
    const clampedY = Math.max(0, Math.min(399, Math.round(y)));

    switch (brushMode) {
      case 'inject_v':
        lattice.inject_chemical(
          clampedX,
          clampedY,
          brushRadius,
          0.95 * brushStrength,
          -0.45 * brushStrength
        );
        break;
      case 'erase':
        lattice.inject_chemical(
          clampedX,
          clampedY,
          brushRadius,
          -1.0 * brushStrength,
          0.9 * brushStrength
        );
        break;
      case 'pulse':
        lattice.inject_chemical(
          clampedX,
          clampedY,
          brushRadius * 2,
          1.0,
          -0.8
        );
        break;
      case 'vortex':
        // Softened injection in turbulence mode to prevent harsh pink/white bursts
        lattice.inject_chemical(
          clampedX,
          clampedY,
          brushRadius,
          0.45 * brushStrength,
          -0.18 * brushStrength
        );
        lattice.perturb_soft(2, 0.32, -0.12);
        break;
    }
  }, []);

  // Continuous interpolated pointer drawing (eliminates gaps during fast pointer movements)
  const drawLine = useCallback(
    (x0: number, y0: number, x1: number, y1: number) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / 4));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        applyBrushAt(x0 + dx * t, y0 + dy * t);
      }
    },
    [applyBrushAt]
  );

  // Pointer event handlers for Canvas
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);
      isPointerDownRef.current = true;

      const rect = canvas.getBoundingClientRect();
      const scaleX = 640 / rect.width;
      const scaleY = 400 / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      lastPointerPosRef.current = { x, y };
      applyBrushAt(x, y);
    },
    [applyBrushAt]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPointerDownRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = 640 / rect.width;
      const scaleY = 400 / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (lastPointerPosRef.current) {
        drawLine(
          lastPointerPosRef.current.x,
          lastPointerPosRef.current.y,
          x,
          y
        );
      } else {
        applyBrushAt(x, y);
      }

      lastPointerPosRef.current = { x, y };
    },
    [applyBrushAt, drawLine]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    lastPointerPosRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture was already released
    }
  }, []);

  // Controls API
  const togglePlayPause = useCallback(() => {
    setState((s) => ({ ...s, isRunning: !s.isRunning }));
  }, []);

  const stepOnce = useCallback(() => {
    const lattice = latticeRef.current;
    if (!lattice) return;
    lattice.step(stateRef.current.substeps);
    lattice.render_pixels(stateRef.current.paletteId);
  }, []);

  const clearGrid = useCallback(() => {
    const lattice = latticeRef.current;
    if (!lattice) return;
    lattice.clear();
  }, []);

  const perturbGrid = useCallback((spots = 12) => {
    const lattice = latticeRef.current;
    if (!lattice) return;
    lattice.perturb(spots);
  }, []);

  const selectPreset = useCallback((presetId: number) => {
    const lattice = latticeRef.current;
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!lattice || !preset) return;

    lattice.set_parameters(
      preset.feed,
      preset.kill,
      preset.diffU,
      preset.diffV,
      1.0
    );
    lattice.load_preset(presetId);

    setState((s) => ({
      ...s,
      presetId,
      feed: preset.feed,
      kill: preset.kill,
      diffU: preset.diffU,
      diffV: preset.diffV,
      dt: 1.0,
    }));
  }, []);

  const selectPalette = useCallback((paletteId: number) => {
    setState((s) => ({ ...s, paletteId }));
  }, []);

  const updateParameters = useCallback(
    (params: Partial<Pick<SimulationState, 'feed' | 'kill' | 'diffU' | 'diffV' | 'dt' | 'substeps' | 'brushRadius' | 'brushStrength' | 'brushMode'>>) => {
      setState((prev) => {
        const next = { ...prev, ...params };
        const lattice = latticeRef.current;
        if (lattice) {
          lattice.set_parameters(
            next.feed,
            next.kill,
            next.diffU,
            next.diffV,
            next.dt
          );
        }
        return next;
      });
    },
    []
  );

  const toggleWallpaperMode = useCallback(() => {
    setState((s) => ({ ...s, isWallpaperMode: !s.isWallpaperMode }));
  }, []);

  const toggleZenMode = useCallback(() => {
    setState((s) => ({ ...s, isZenMode: !s.isZenMode }));
  }, []);

  const activateWallpaperPreset = useCallback(() => {
    const lattice = latticeRef.current;
    if (!lattice) return;

    // Preset 4 is Chaos / Turbulence: F=0.0180, k=0.0510
    const chaosPreset = PRESETS[4];
    lattice.set_parameters(
      chaosPreset.feed,
      chaosPreset.kill,
      chaosPreset.diffU,
      chaosPreset.diffV,
      0.5 // 2x slower time step dt for calm, meditative live wallpaper motion
    );
    lattice.load_preset(4);

    setState((s) => ({
      ...s,
      presetId: 4,
      paletteId: 0, // Neon Cyberpunk
      isWallpaperMode: true,
      substeps: 4,
      brushStrength: 0.70,
      brushRadius: 18,
      feed: chaosPreset.feed,
      kill: chaosPreset.kill,
      diffU: chaosPreset.diffU,
      diffV: chaosPreset.diffV,
      dt: 0.5,
    }));
  }, []);

  return {
    canvasRef,
    isReady,
    error,
    state,
    telemetry,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
    },
    actions: {
      togglePlayPause,
      stepOnce,
      clearGrid,
      perturbGrid,
      selectPreset,
      selectPalette,
      updateParameters,
      toggleWallpaperMode,
      toggleZenMode,
      activateWallpaperPreset,
    },
  };
}
