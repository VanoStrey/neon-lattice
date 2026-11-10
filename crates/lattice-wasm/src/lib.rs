use lattice_core::{ColorPalette, LatticeGrid, PaletteType, GRID_HEIGHT, GRID_WIDTH};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct LatticeWasm {
    grid: LatticeGrid,
    palettes: [ColorPalette; 5],
}

#[wasm_bindgen]
impl LatticeWasm {
    /// Initialize a new 640x400 (16:10 MacBook native) lattice simulation engine.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let grid = LatticeGrid::new();
        let palettes = [
            ColorPalette::new(PaletteType::Cyberpunk),
            ColorPalette::new(PaletteType::Bioluminescence),
            ColorPalette::new(PaletteType::Magma),
            ColorPalette::new(PaletteType::AcidMatrix),
            ColorPalette::new(PaletteType::Vaporwave),
        ];

        Self { grid, palettes }
    }

    /// Execute `substeps` simulation ticks.
    pub fn step(&mut self, substeps: u32) {
        self.grid.step_multiple(substeps);
    }

    /// Render field into internal RGBA frame buffer using the specified palette ID (0-4).
    pub fn render_pixels(&mut self, palette_id: u32) {
        let p_idx = (palette_id as usize).min(self.palettes.len() - 1);
        self.grid.render_frame(&self.palettes[p_idx]);
    }

    /// Raw pointer to the internal 64-byte aligned RGBA pixel buffer in WASM linear memory.
    ///
    /// Used by JavaScript for Zero-Copy rendering:
    /// `new Uint8ClampedArray(wasm.memory.buffer, ptr, len)`
    pub fn get_frame_buffer_ptr(&self) -> *const u8 {
        self.grid.frame_buffer_ptr()
    }

    /// Byte length of the frame buffer (512 * 512 * 4 = 1,048,576 bytes).
    pub fn get_frame_buffer_len(&self) -> usize {
        self.grid.frame_buffer_len()
    }

    /// Inject chemical concentrations at coordinates `(x, y)` with given radius and strengths.
    pub fn inject_chemical(&mut self, x: u32, y: u32, radius: u32, amount_v: f32, amount_u: f32) {
        self.grid.inject(
            x as usize,
            y as usize,
            radius as usize,
            amount_v,
            amount_u,
        );
    }

    /// Update simulation physical parameters.
    pub fn set_parameters(&mut self, feed: f32, kill: f32, diff_u: f32, diff_v: f32, dt: f32) {
        self.grid.config.feed = feed;
        self.grid.config.kill = kill;
        self.grid.config.diff_u = diff_u;
        self.grid.config.diff_v = diff_v;
        self.grid.config.dt = dt;
    }

    /// Load an archetypal preset geometry and parameters (0-7).
    pub fn load_preset(&mut self, preset_id: u32) {
        self.grid.seed_preset_pattern(preset_id);
    }

    /// Clear the entire grid (U = 1.0, V = 0.0).
    pub fn clear(&mut self) {
        self.grid.clear();
    }

    /// Inject random seed disturbances across the grid with default soft intensity.
    pub fn perturb(&mut self, spots: u32) {
        self.grid.perturb(spots as usize);
    }

    /// Inject subtle disturbances with customizable amplitude (for gentle ambient wallpaper evolution).
    pub fn perturb_soft(&mut self, spots: u32, amount_v: f32, amount_u: f32) {
        self.grid.perturb_soft(spots as usize, amount_v, amount_u);
    }

    /// Total count of cells with active morphogen concentration (V > 0.08).
    pub fn get_active_cells(&self) -> usize {
        self.grid.count_active_cells()
    }

    /// Mean morphogen concentration V across the 262,144 cells.
    pub fn get_mean_v(&self) -> f32 {
        self.grid.mean_concentration_v()
    }

    /// Total simulation steps computed.
    pub fn get_step_counter(&self) -> u64 {
        self.grid.step_counter
    }

    /// Grid width (640).
    pub fn get_width(&self) -> u32 {
        GRID_WIDTH as u32
    }

    /// Grid height (400).
    pub fn get_height(&self) -> u32 {
        GRID_HEIGHT as u32
    }

    /// Current feed rate.
    pub fn get_feed(&self) -> f32 {
        self.grid.config.feed
    }

    /// Current kill rate.
    pub fn get_kill(&self) -> f32 {
        self.grid.config.kill
    }

    /// Current U diffusion rate.
    pub fn get_diff_u(&self) -> f32 {
        self.grid.config.diff_u
    }

    /// Current V diffusion rate.
    pub fn get_diff_v(&self) -> f32 {
        self.grid.config.diff_v
    }

    /// Current time step dt.
    pub fn get_dt(&self) -> f32 {
        self.grid.config.dt
    }
}

impl Default for LatticeWasm {
    fn default() -> Self {
        Self::new()
    }
}
