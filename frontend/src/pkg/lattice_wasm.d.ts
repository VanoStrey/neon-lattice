/* tslint:disable */
/* eslint-disable */

export class LatticeWasm {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Clear the entire grid (U = 1.0, V = 0.0).
     */
    clear(): void;
    /**
     * Total count of cells with active morphogen concentration (V > 0.08).
     */
    get_active_cells(): number;
    /**
     * Current U diffusion rate.
     */
    get_diff_u(): number;
    /**
     * Current V diffusion rate.
     */
    get_diff_v(): number;
    /**
     * Current time step dt.
     */
    get_dt(): number;
    /**
     * Current feed rate.
     */
    get_feed(): number;
    /**
     * Byte length of the frame buffer (512 * 512 * 4 = 1,048,576 bytes).
     */
    get_frame_buffer_len(): number;
    /**
     * Raw pointer to the internal 64-byte aligned RGBA pixel buffer in WASM linear memory.
     *
     * Used by JavaScript for Zero-Copy rendering:
     * `new Uint8ClampedArray(wasm.memory.buffer, ptr, len)`
     */
    get_frame_buffer_ptr(): number;
    /**
     * Grid height (400).
     */
    get_height(): number;
    /**
     * Current kill rate.
     */
    get_kill(): number;
    /**
     * Mean morphogen concentration V across the 262,144 cells.
     */
    get_mean_v(): number;
    /**
     * Total simulation steps computed.
     */
    get_step_counter(): bigint;
    /**
     * Grid width (640).
     */
    get_width(): number;
    /**
     * Inject chemical concentrations at coordinates `(x, y)` with given radius and strengths.
     */
    inject_chemical(x: number, y: number, radius: number, amount_v: number, amount_u: number): void;
    /**
     * Load an archetypal preset geometry and parameters (0-7).
     */
    load_preset(preset_id: number): void;
    /**
     * Initialize a new 640x400 (16:10 MacBook native) lattice simulation engine.
     */
    constructor();
    /**
     * Inject random seed disturbances across the grid with default soft intensity.
     */
    perturb(spots: number): void;
    /**
     * Inject subtle disturbances with customizable amplitude (for gentle ambient wallpaper evolution).
     */
    perturb_soft(spots: number, amount_v: number, amount_u: number): void;
    /**
     * Render field into internal RGBA frame buffer using the specified palette ID (0-4).
     */
    render_pixels(palette_id: number): void;
    /**
     * Update simulation physical parameters.
     */
    set_parameters(feed: number, kill: number, diff_u: number, diff_v: number, dt: number): void;
    /**
     * Execute `substeps` simulation ticks.
     */
    step(substeps: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_latticewasm_free: (a: number, b: number) => void;
    readonly latticewasm_clear: (a: number) => void;
    readonly latticewasm_get_active_cells: (a: number) => number;
    readonly latticewasm_get_diff_u: (a: number) => number;
    readonly latticewasm_get_diff_v: (a: number) => number;
    readonly latticewasm_get_dt: (a: number) => number;
    readonly latticewasm_get_feed: (a: number) => number;
    readonly latticewasm_get_frame_buffer_len: (a: number) => number;
    readonly latticewasm_get_frame_buffer_ptr: (a: number) => number;
    readonly latticewasm_get_height: (a: number) => number;
    readonly latticewasm_get_kill: (a: number) => number;
    readonly latticewasm_get_mean_v: (a: number) => number;
    readonly latticewasm_get_step_counter: (a: number) => bigint;
    readonly latticewasm_get_width: (a: number) => number;
    readonly latticewasm_inject_chemical: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly latticewasm_load_preset: (a: number, b: number) => void;
    readonly latticewasm_new: () => number;
    readonly latticewasm_perturb: (a: number, b: number) => void;
    readonly latticewasm_perturb_soft: (a: number, b: number, c: number, d: number) => void;
    readonly latticewasm_render_pixels: (a: number, b: number) => void;
    readonly latticewasm_set_parameters: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly latticewasm_step: (a: number, b: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
