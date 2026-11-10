# AGENTS.md — System Topology & Architectural Invariants for AI Agents

> **Audience**: AI Coding Agents (Antigravity / LLM Pair Programmers).  
> **Purpose**: Eliminates token-wasting exploratory file reads and blind grepping. Read this file first to locate the exact files to edit, understand data flow contracts, and follow the sacred architectural invariants.

---

## 1. Quick File-to-Feature Topology Map

When asked to modify a feature, navigate directly to the designated file:

| User Feature / Area | Component / Markup | Stylesheet | Logic / Controller | Contracts / Types |
|---|---|---|---|---|
| **Simulation Core Engine** | — | — | `crates/lattice-core/src/grid.rs` | `crates/lattice-core/src/sim.rs` |
| **Memory Alignment & Buffers** | — | — | `crates/lattice-core/src/aligned.rs` | `crates/lattice-core/src/aligned.rs` |
| **Color LUTs & Palettes** | — | — | `crates/lattice-core/src/palette.rs` | `crates/lattice-core/src/palette.rs` |
| **WASM Zero-Copy Bridge** | — | — | `crates/lattice-wasm/src/lib.rs` | `frontend/src/pkg/lattice_wasm.d.ts` |
| **Simulation Hook & Render Loop** | — | — | `frontend/src/hooks/useLatticeSimulation.ts` | `frontend/src/types/simulation.ts` |
| **Interactive Canvas Viewport** | `frontend/src/components/CanvasViewport.tsx` | Tailwind CSS v4 / `index.css` | `frontend/src/components/CanvasViewport.tsx` | `frontend/src/types/simulation.ts` |
| **Parameter Controls & Sliders** | `frontend/src/components/ControlPanel.tsx` | Tailwind CSS v4 | `frontend/src/components/ControlPanel.tsx` | `frontend/src/types/simulation.ts` |
| **Telemetry HUD (FPS/ms/Cells)** | `frontend/src/components/TelemetryHUD.tsx` | Tailwind CSS v4 | `frontend/src/components/TelemetryHUD.tsx` | `frontend/src/types/simulation.ts` |
| **Preset Archetype Selector** | `frontend/src/components/PresetSelector.tsx` | Tailwind CSS v4 | `frontend/src/components/PresetSelector.tsx` | `frontend/src/types/simulation.ts` |
| **Chromatographic Palettes** | `frontend/src/components/PaletteSelector.tsx` | Tailwind CSS v4 | `frontend/src/components/PaletteSelector.tsx` | `frontend/src/types/simulation.ts` |
| **App Layout & Keyboard Hotkeys**| `frontend/src/App.tsx` | `frontend/src/index.css` | `frontend/src/App.tsx` | `frontend/src/types/simulation.ts` |
| **macOS Live Wallpaper Engine** | `NeonWallpaper.app` | — | `tools/neon-wallpaper/main.swift` | `install.sh` / `scripts/install_wallpaper.sh` |

---

## 2. Sacred Architectural Invariants (DO NOT VIOLATE)

1. **Zero-Copy Frame Memory Boundary**:
   - The pixel buffer is written directly inside WASM linear memory into a 64-byte cache-line aligned array (`[u8; 640 * 400 * 4]`, 1,024,000 bytes).
   - JavaScript MUST read this buffer directly via `new Uint8ClampedArray(wasm.memory.buffer, ptr, len)` and blit with `ctx.putImageData(imgData, 0, 0)`.
   - Never serialize simulation states or pixel arrays through JSON, strings, or intermediate copy arrays.
2. **Bounds Check Elimination (BCE) in Hot Loops**:
   - In `crates/lattice-core/src/grid.rs`, inner simulation loops over rows $y \in 0..400$ and columns $x \in 1..639$ MUST operate on sub-slices with identical pre-validated lengths (638).
   - Never re-introduce raw index lookups like `grid[y * width + x]` without bounds proof inside inner loops.
3. **Branchless Boundary Conditions & Native 16:10 Geometry**:
   - Simulation field has native 16:10 aspect ratio matching MacBook displays (`GRID_WIDTH = 640`, `GRID_HEIGHT = 400`).
   - Scales with 4x integer scaling directly to $2560 \times 1600$ Retina resolution without cropping or stretching.
   - Toroidal boundary conditions wrap coordinates smoothly across both dimensions.
4. **Zero Heap Allocations in `tick()`**:
   - All double-buffered `AlignedBuffer<f32>` arrays are allocated once upon instantiation.
   - Buffer swapping occurs via pointer swap (`std::mem::swap`). No `Vec::new()`, `clone()`, or dynamic heap reallocations are permitted in the per-frame tick path.
5. **Modern Frontend Standards**:
   - React 19 hooks and strict typing.
   - Tailwind CSS v4 CSS-first configuration via `@import "tailwindcss";` and `@tailwindcss/vite` (no legacy `tailwind.config.js`).
6. **macOS Native Live Wallpaper Invariant**:
   - Desktop layer MUST sit at `Int(CGWindowLevelForKey(.desktopIconWindow)) - 1` (`-2147483604`).
   - Sits strictly above macOS static backdrop (`-2147483622`) and below Finder Desktop Icons (`-2147483603`).
   - Infinite real-time simulation powered by Metal GPU Compute Shaders (300 simulation steps/sec across 256,000 cells). Zero video looping.
   - Bilinear reconstruction and tone-mapping directly to display surface at locked 60 FPS.
   - Must pause on Screen Sleep and Lock (`0.0% CPU / 0.0% GPU`).
   - `window.ignoresMouseEvents = true` to preserve 100% Finder click-through and desktop interactions.
7. **N-Body Gravitational Kinematics & Slingshot Invariant (Layered Motion)**:
   - Exactly 3 autonomous drift agents across $640 \times 400$ toroidal space.
   - Base motion: pure, long sweeping random arcs (5s to 11s duration, ultra-gentle curvature) driven by an undisturbed procedural angular momentum generator.
   - Layered perturbation: Newtonian gravity, Plummer softening ($\epsilon = 12.0$), and Hermite cutoff fade at $R_{\text{influence}} = 2.8 \times (r_1 + r_2)$ act via additive velocity offsets $(gvx, gvy)$ layered cleanly on top.
   - Dynamic breathing radius proportional to field coverage: $R_{\text{max}} = 18.0 + \rho \cdot 32.0$ (expands up to $50\text{px}$ as simulation fills with morphogen). Radius smoothly breathes with inertia factor $0.990$.
   - Inertial mass strictly proportional to current dynamic area: $m_i \propto (r_i / 16)^2$, allowing gravitational roles to organically shift as cursors breathe.
   - Newton's 3rd Law is strictly conserved: $\vec{F}_{ij} = -\vec{F}_{ji}$ and $\sum_k \vec{F}_k = \vec{0}$.
   - Toroidal shortest displacement wrapping across both dimensions.
   - Elastic anti-sticking repulsion core inside $d < r_1 + r_2$ guarantees agents never clump or fuse.
   - Hyperbolic flybys produce realistic gravitational slingshot maneuvers: velocity boosts up to $+90\%$ ($1.90 \times v_{\text{base}}$) with smooth dissipation ($\tau \approx 0.7\text{–}1.2$s) back to the pure procedural sweeping arc.

---

## 3. Reactive State Dictionary

| Key | Type | Initial Value | Description |
|---|---|---|---|
| `isRunning` | `boolean` | `true` | Execution state of the `requestAnimationFrame` simulation loop. |
| `isWallpaperMode` | `boolean` | `false` | Autonomous drift agent simulation (macOS Live Wallpaper mode). |
| `isZenMode` | `boolean` | `false` | Fullscreen borderless canvas view with hidden HUD. |
| `presetId` | `number` | `0` | Active archetypal preset (0=Mitosis, 1=Solitons, 2=Coral, etc.). |
| `paletteId` | `number` | `0` | Active color gradient LUT (0=Cyberpunk, 1=Bioluminescence, etc.). |
| `substeps` | `number` | `6` | Simulation ticks calculated per visual animation frame (1x - 16x). |
| `feed` | `number` | `0.0367` | Gray-Scott feed rate parameter ($F$). |
| `kill` | `number` | `0.0649` | Gray-Scott kill rate parameter ($k$). |
| `diffU` | `number` | `0.2097` | Diffusion coefficient $D_u$ of inhibitor chemical $U$. |
| `diffV` | `number` | `0.1050` | Diffusion coefficient $D_v$ of activator chemical $V$. |
| `dt` | `number` | `1.0` | Discrete Euler time-step integration parameter. |
| `brushRadius` | `number` | `18` | Circular radius (in grid pixels) for pointer interactions. |
| `brushStrength` | `number` | `0.9` | Amplitude factor for chemical injection/inhibition. |
| `brushMode` | `BrushMode` | `'inject_v'` | Interactive mode: `'inject_v'`, `'erase'`, `'pulse'`, `'vortex'`. |

---

## 4. Telemetry & Metric Dictionary

| Metric | Source | Unit | Description |
|---|---|---|---|
| `fps` | `performance.now()` | frames/sec | Real-time viewport render rate. |
| `wasmComputeTimeMs` | `performance.now()` | ms/frame | Pure Rust WASM execution time for `step(substeps)` + palette pack. |
| `activeCells` | `lattice.get_active_cells()` | count | Number of grid cells with active morphogen concentration ($V > 0.08$). |
| `stepCounter` | `lattice.get_step_counter()` | count | Cumulative simulation ticks executed by the engine. |
| `totalMemoryBytes` | `lattice.get_frame_buffer_len()` | bytes | Linear memory size of the zero-copy RGBA buffer (1,024,000 B). |

---

## 5. Agent Verification Suite

Run the single-stage verification script before completing any work turn:
```bash
./scripts/agent_check.sh
```

Validates:
1. `cargo check --workspace --message-format=short`
2. `cargo check -p lattice-wasm --target wasm32-unknown-unknown --message-format=short`
3. `cargo test --workspace --quiet`
4. `tsc -b --pretty false` in `frontend`
5. `swiftc -O -whole-module-optimization tools/neon-wallpaper/main.swift`
