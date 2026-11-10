/* @ts-self-types="./lattice_wasm.d.ts" */

export class LatticeWasm {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LatticeWasmFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_latticewasm_free(ptr, 0);
    }
    /**
     * Clear the entire grid (U = 1.0, V = 0.0).
     */
    clear() {
        wasm.latticewasm_clear(this.__wbg_ptr);
    }
    /**
     * Total count of cells with active morphogen concentration (V > 0.08).
     * @returns {number}
     */
    get_active_cells() {
        const ret = wasm.latticewasm_get_active_cells(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Current U diffusion rate.
     * @returns {number}
     */
    get_diff_u() {
        const ret = wasm.latticewasm_get_diff_u(this.__wbg_ptr);
        return ret;
    }
    /**
     * Current V diffusion rate.
     * @returns {number}
     */
    get_diff_v() {
        const ret = wasm.latticewasm_get_diff_v(this.__wbg_ptr);
        return ret;
    }
    /**
     * Current time step dt.
     * @returns {number}
     */
    get_dt() {
        const ret = wasm.latticewasm_get_dt(this.__wbg_ptr);
        return ret;
    }
    /**
     * Current feed rate.
     * @returns {number}
     */
    get_feed() {
        const ret = wasm.latticewasm_get_feed(this.__wbg_ptr);
        return ret;
    }
    /**
     * Byte length of the frame buffer (512 * 512 * 4 = 1,048,576 bytes).
     * @returns {number}
     */
    get_frame_buffer_len() {
        const ret = wasm.latticewasm_get_frame_buffer_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Raw pointer to the internal 64-byte aligned RGBA pixel buffer in WASM linear memory.
     *
     * Used by JavaScript for Zero-Copy rendering:
     * `new Uint8ClampedArray(wasm.memory.buffer, ptr, len)`
     * @returns {number}
     */
    get_frame_buffer_ptr() {
        const ret = wasm.latticewasm_get_frame_buffer_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Grid height (400).
     * @returns {number}
     */
    get_height() {
        const ret = wasm.latticewasm_get_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Current kill rate.
     * @returns {number}
     */
    get_kill() {
        const ret = wasm.latticewasm_get_kill(this.__wbg_ptr);
        return ret;
    }
    /**
     * Mean morphogen concentration V across the 262,144 cells.
     * @returns {number}
     */
    get_mean_v() {
        const ret = wasm.latticewasm_get_mean_v(this.__wbg_ptr);
        return ret;
    }
    /**
     * Total simulation steps computed.
     * @returns {bigint}
     */
    get_step_counter() {
        const ret = wasm.latticewasm_get_step_counter(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Grid width (640).
     * @returns {number}
     */
    get_width() {
        const ret = wasm.latticewasm_get_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Inject chemical concentrations at coordinates `(x, y)` with given radius and strengths.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {number} amount_v
     * @param {number} amount_u
     */
    inject_chemical(x, y, radius, amount_v, amount_u) {
        wasm.latticewasm_inject_chemical(this.__wbg_ptr, x, y, radius, amount_v, amount_u);
    }
    /**
     * Load an archetypal preset geometry and parameters (0-7).
     * @param {number} preset_id
     */
    load_preset(preset_id) {
        wasm.latticewasm_load_preset(this.__wbg_ptr, preset_id);
    }
    /**
     * Initialize a new 640x400 (16:10 MacBook native) lattice simulation engine.
     */
    constructor() {
        const ret = wasm.latticewasm_new();
        this.__wbg_ptr = ret;
        LatticeWasmFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Inject random seed disturbances across the grid with default soft intensity.
     * @param {number} spots
     */
    perturb(spots) {
        wasm.latticewasm_perturb(this.__wbg_ptr, spots);
    }
    /**
     * Inject subtle disturbances with customizable amplitude (for gentle ambient wallpaper evolution).
     * @param {number} spots
     * @param {number} amount_v
     * @param {number} amount_u
     */
    perturb_soft(spots, amount_v, amount_u) {
        wasm.latticewasm_perturb_soft(this.__wbg_ptr, spots, amount_v, amount_u);
    }
    /**
     * Render field into internal RGBA frame buffer using the specified palette ID (0-4).
     * @param {number} palette_id
     */
    render_pixels(palette_id) {
        wasm.latticewasm_render_pixels(this.__wbg_ptr, palette_id);
    }
    /**
     * Update simulation physical parameters.
     * @param {number} feed
     * @param {number} kill
     * @param {number} diff_u
     * @param {number} diff_v
     * @param {number} dt
     */
    set_parameters(feed, kill, diff_u, diff_v, dt) {
        wasm.latticewasm_set_parameters(this.__wbg_ptr, feed, kill, diff_u, diff_v, dt);
    }
    /**
     * Execute `substeps` simulation ticks.
     * @param {number} substeps
     */
    step(substeps) {
        wasm.latticewasm_step(this.__wbg_ptr, substeps);
    }
}
if (Symbol.dispose) LatticeWasm.prototype[Symbol.dispose] = LatticeWasm.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            table.set(0, undefined);
            table.set(1024, undefined);
            table.set(1025, null);
            table.set(1026, true);
            table.set(1027, false);
        },
    };
    return {
        __proto__: null,
        "./lattice_wasm_bg.js": import0,
    };
}

const LatticeWasmFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_latticewasm_free(ptr, 1));

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
    numBytesDecoded += bytes.length;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
        cachedTextDecoder.decode();
        numBytesDecoded = bytes.length;
    }
    return cachedTextDecoder.decode(bytes);
}

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

let __wbg_init_promise;
async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (__wbg_init_promise === undefined) {
        __wbg_init_promise = __wbg_init_once(module_or_path);
        __wbg_init_promise.catch(() => { __wbg_init_promise = undefined; });
    }
    return __wbg_init_promise;
}

async function __wbg_init_once(module_or_path) {

    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('lattice_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
