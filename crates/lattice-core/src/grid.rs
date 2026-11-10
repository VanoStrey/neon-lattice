use crate::aligned::AlignedBuffer;
use crate::palette::ColorPalette;
use crate::sim::SimulationConfig;

/// Native 16:10 aspect ratio resolution matching MacBook Retina displays
pub const GRID_WIDTH: usize = 640;
pub const GRID_HEIGHT: usize = 400;
pub const TOTAL_CELLS: usize = GRID_WIDTH * GRID_HEIGHT; // 256,000 cells (16:10)
pub const FRAME_BUFFER_BYTES: usize = TOTAL_CELLS * 4; // 1,024,000 bytes (RGBA32, 64-byte aligned)

/// Core reaction-diffusion lattice simulation grid with native 16:10 geometry.
///
/// Features:
/// - 64-byte cache-line aligned continuous buffers.
/// - Toroidal periodic boundary conditions.
/// - Bounds Check Elimination (BCE) across all hot inner loops.
/// - Zero heap allocations during `tick()`.
pub struct LatticeGrid {
    pub width: usize,
    pub height: usize,
    pub config: SimulationConfig,
    pub step_counter: u64,

    // Double-buffered concentration fields for substances U and V
    u_curr: AlignedBuffer<f32>,
    u_next: AlignedBuffer<f32>,
    v_curr: AlignedBuffer<f32>,
    v_next: AlignedBuffer<f32>,

    // 64-byte aligned RGBA frame buffer for direct zero-copy canvas blitting
    frame_buffer: AlignedBuffer<u8>,

    // High-speed branchless PRNG state (Xorshift64)
    rng_state: u64,
}

impl LatticeGrid {
    pub fn new() -> Self {
        let mut grid = Self {
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            config: SimulationConfig::default(),
            step_counter: 0,
            u_curr: AlignedBuffer::filled(TOTAL_CELLS, 1.0),
            u_next: AlignedBuffer::filled(TOTAL_CELLS, 1.0),
            v_curr: AlignedBuffer::filled(TOTAL_CELLS, 0.0),
            v_next: AlignedBuffer::filled(TOTAL_CELLS, 0.0),
            frame_buffer: AlignedBuffer::zeroed(FRAME_BUFFER_BYTES),
            rng_state: 0x8542_5914_6382_9185,
        };

        // Initialize with default mitosis seed
        grid.seed_preset_pattern(0);
        grid
    }

    /// Fast branchless Xorshift64 PRNG
    #[inline(always)]
    fn next_random_u64(&mut self) -> u64 {
        let mut x = self.rng_state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.rng_state = x;
        x
    }

    /// Single simulation step.
    ///
    /// Fully optimized with Bounds Check Elimination (BCE):
    /// Slices are pre-computed row by row and interior columns are processed
    /// without boundary branches or bounds checks.
    pub fn tick(&mut self) {
        let diff_u = self.config.diff_u;
        let diff_v = self.config.diff_v;
        let feed = self.config.feed;
        let kill = self.config.kill;
        let dt = self.config.dt;

        let u_in = self.u_curr.as_slice();
        let v_in = self.v_curr.as_slice();
        let u_out = self.u_next.as_mut_slice();
        let v_out = self.v_next.as_mut_slice();

        // 9-point discrete Laplacian weights:
        // Cardinal neighbors (up, down, left, right): 0.2
        // Diagonal neighbors (corners): 0.05
        // Center cell: -1.0
        // Net sum of weights: 4 * 0.2 + 4 * 0.05 - 1.0 = 0.0 (exact mass conservation)
        const W_CARD: f32 = 0.20;
        const W_DIAG: f32 = 0.05;

        for y in 0..GRID_HEIGHT {
            let y_top = if y == 0 { GRID_HEIGHT - 1 } else { y - 1 };
            let y_bot = if y == GRID_HEIGHT - 1 { 0 } else { y + 1 };

            let row_offset = y * GRID_WIDTH;
            let top_offset = y_top * GRID_WIDTH;
            let bot_offset = y_bot * GRID_WIDTH;

            let u_mid_row = &u_in[row_offset..row_offset + GRID_WIDTH];
            let u_top_row = &u_in[top_offset..top_offset + GRID_WIDTH];
            let u_bot_row = &u_in[bot_offset..bot_offset + GRID_WIDTH];

            let v_mid_row = &v_in[row_offset..row_offset + GRID_WIDTH];
            let v_top_row = &v_in[top_offset..top_offset + GRID_WIDTH];
            let v_bot_row = &v_in[bot_offset..bot_offset + GRID_WIDTH];

            let u_out_row = &mut u_out[row_offset..row_offset + GRID_WIDTH];
            let v_out_row = &mut v_out[row_offset..row_offset + GRID_WIDTH];

            // 1. Boundary Column: x = 0 (left wraps to GRID_WIDTH - 1)
            {
                let x_l = GRID_WIDTH - 1;
                let x_r = 1;

                let lap_u = W_CARD * (u_top_row[0] + u_bot_row[0] + u_mid_row[x_l] + u_mid_row[x_r])
                    + W_DIAG * (u_top_row[x_l] + u_top_row[x_r] + u_bot_row[x_l] + u_bot_row[x_r])
                    - u_mid_row[0];

                let lap_v = W_CARD * (v_top_row[0] + v_bot_row[0] + v_mid_row[x_l] + v_mid_row[x_r])
                    + W_DIAG * (v_top_row[x_l] + v_top_row[x_r] + v_bot_row[x_l] + v_bot_row[x_r])
                    - v_mid_row[0];

                let u = u_mid_row[0];
                let v = v_mid_row[0];
                let uv2 = u * v * v;

                let du = diff_u * lap_u - uv2 + feed * (1.0 - u);
                let dv = diff_v * lap_v + uv2 - (feed + kill) * v;

                u_out_row[0] = (u + dt * du).clamp(0.0, 1.0);
                v_out_row[0] = (v + dt * dv).clamp(0.0, 1.0);
            }

            // 2. Interior Columns: x = 1..(GRID_WIDTH - 1) (Exact length GRID_WIDTH - 2 = 638)
            // By sub-slicing all arrays to identical lengths (638), the Rust compiler / LLVM
            // completely eliminates all bounds checks and auto-vectorizes this loop with SIMD.
            {
                let u_c = &u_mid_row[1..GRID_WIDTH - 1];
                let v_c = &v_mid_row[1..GRID_WIDTH - 1];

                let u_l = &u_mid_row[0..GRID_WIDTH - 2];
                let v_l = &v_mid_row[0..GRID_WIDTH - 2];
                let u_r = &u_mid_row[2..GRID_WIDTH];
                let v_r = &v_mid_row[2..GRID_WIDTH];

                let u_t = &u_top_row[1..GRID_WIDTH - 1];
                let v_t = &v_top_row[1..GRID_WIDTH - 1];
                let u_tl = &u_top_row[0..GRID_WIDTH - 2];
                let v_tl = &v_top_row[0..GRID_WIDTH - 2];
                let u_tr = &u_top_row[2..GRID_WIDTH];
                let v_tr = &v_top_row[2..GRID_WIDTH];

                let u_b = &u_bot_row[1..GRID_WIDTH - 1];
                let v_b = &v_bot_row[1..GRID_WIDTH - 1];
                let u_bl = &u_bot_row[0..GRID_WIDTH - 2];
                let v_bl = &v_bot_row[0..GRID_WIDTH - 2];
                let u_br = &u_bot_row[2..GRID_WIDTH];
                let v_br = &v_bot_row[2..GRID_WIDTH];

                let out_u = &mut u_out_row[1..GRID_WIDTH - 1];
                let out_v = &mut v_out_row[1..GRID_WIDTH - 1];

                for i in 0..(GRID_WIDTH - 2) {
                    let lap_u = W_CARD * (u_t[i] + u_b[i] + u_l[i] + u_r[i])
                        + W_DIAG * (u_tl[i] + u_tr[i] + u_bl[i] + u_br[i])
                        - u_c[i];

                    let lap_v = W_CARD * (v_t[i] + v_b[i] + v_l[i] + v_r[i])
                        + W_DIAG * (v_tl[i] + v_tr[i] + v_bl[i] + v_br[i])
                        - v_c[i];

                    let u = u_c[i];
                    let v = v_c[i];
                    let uv2 = u * v * v;

                    let du = diff_u * lap_u - uv2 + feed * (1.0 - u);
                    let dv = diff_v * lap_v + uv2 - (feed + kill) * v;

                    out_u[i] = (u + dt * du).clamp(0.0, 1.0);
                    out_v[i] = (v + dt * dv).clamp(0.0, 1.0);
                }
            }

            // 3. Boundary Column: x = GRID_WIDTH - 1 (right wraps to 0)
            {
                let x = GRID_WIDTH - 1;
                let x_l = GRID_WIDTH - 2;
                let x_r = 0;

                let lap_u = W_CARD * (u_top_row[x] + u_bot_row[x] + u_mid_row[x_l] + u_mid_row[x_r])
                    + W_DIAG * (u_top_row[x_l] + u_top_row[x_r] + u_bot_row[x_l] + u_bot_row[x_r])
                    - u_mid_row[x];

                let lap_v = W_CARD * (v_top_row[x] + v_bot_row[x] + v_mid_row[x_l] + v_mid_row[x_r])
                    + W_DIAG * (v_top_row[x_l] + v_top_row[x_r] + v_bot_row[x_l] + v_bot_row[x_r])
                    - v_mid_row[x];

                let u = u_mid_row[x];
                let v = v_mid_row[x];
                let uv2 = u * v * v;

                let du = diff_u * lap_u - uv2 + feed * (1.0 - u);
                let dv = diff_v * lap_v + uv2 - (feed + kill) * v;

                u_out_row[x] = (u + dt * du).clamp(0.0, 1.0);
                v_out_row[x] = (v + dt * dv).clamp(0.0, 1.0);
            }
        }

        // Zero-allocation buffer swap: pointers are swapped in place
        std::mem::swap(&mut self.u_curr, &mut self.u_next);
        std::mem::swap(&mut self.v_curr, &mut self.v_next);

        self.step_counter = self.step_counter.wrapping_add(1);
    }

    /// Execute multiple simulation substeps in a single frame.
    #[inline(always)]
    pub fn step_multiple(&mut self, substeps: u32) {
        for _ in 0..substeps {
            self.tick();
        }
    }

    /// Render current field concentrations into the 64-byte aligned RGBA frame buffer.
    pub fn render_frame(&mut self, palette: &ColorPalette) {
        let pixels: &mut [u32] = unsafe {
            std::slice::from_raw_parts_mut(
                self.frame_buffer.as_mut_ptr() as *mut u32,
                TOTAL_CELLS,
            )
        };

        let v_slice = self.v_curr.as_slice();

        // Process in 8-element chunks for unrolling and memory pipeline efficiency
        let (v_chunks, v_rem) = v_slice.as_chunks::<8>();
        let (p_chunks, p_rem) = pixels.as_chunks_mut::<8>();

        for (v_c, p_c) in v_chunks.iter().zip(p_chunks.iter_mut()) {
            p_c[0] = palette.get_pixel_u32((v_c[0] * 255.0) as usize);
            p_c[1] = palette.get_pixel_u32((v_c[1] * 255.0) as usize);
            p_c[2] = palette.get_pixel_u32((v_c[2] * 255.0) as usize);
            p_c[3] = palette.get_pixel_u32((v_c[3] * 255.0) as usize);
            p_c[4] = palette.get_pixel_u32((v_c[4] * 255.0) as usize);
            p_c[5] = palette.get_pixel_u32((v_c[5] * 255.0) as usize);
            p_c[6] = palette.get_pixel_u32((v_c[6] * 255.0) as usize);
            p_c[7] = palette.get_pixel_u32((v_c[7] * 255.0) as usize);
        }

        for (v_val, p_val) in v_rem.iter().zip(p_rem.iter_mut()) {
            *p_val = palette.get_pixel_u32((*v_val * 255.0) as usize);
        }
    }

    /// Raw pointer to the RGBA frame buffer in linear memory (for Zero-Copy sharing with JS).
    #[inline(always)]
    pub fn frame_buffer_ptr(&self) -> *const u8 {
        self.frame_buffer.as_ptr()
    }

    /// Length of the RGBA frame buffer in bytes ($640 \times 400 \times 4 = 1,024,000$).
    #[inline(always)]
    pub fn frame_buffer_len(&self) -> usize {
        FRAME_BUFFER_BYTES
    }

    /// Inject chemical concentrations at coordinates `(center_x, center_y)` with a smooth brush falloff.
    pub fn inject(&mut self, center_x: usize, center_y: usize, radius: usize, amount_v: f32, amount_u: f32) {
        let r = radius.max(1) as isize;
        let r_sq = (r * r) as f32;

        let u_slice = self.u_curr.as_mut_slice();
        let v_slice = self.v_curr.as_mut_slice();

        for dy in -r..=r {
            let py = ((center_y as isize + dy).rem_euclid(GRID_HEIGHT as isize)) as usize;
            let dy_sq = (dy * dy) as f32;

            for dx in -r..=r {
                let d_sq = dy_sq + (dx * dx) as f32;
                if d_sq <= r_sq {
                    let s = 1.0 - (d_sq / r_sq);
                    // Smooth Hermite cubic interpolation for seamless organic falloff
                    let factor = s * s * (3.0 - 2.0 * s);
                    let px = ((center_x as isize + dx).rem_euclid(GRID_WIDTH as isize)) as usize;
                    let idx = py * GRID_WIDTH + px;

                    if amount_v != 0.0 {
                        v_slice[idx] = (v_slice[idx] + amount_v * factor).clamp(0.0, 1.0);
                    }
                    if amount_u != 0.0 {
                        u_slice[idx] = (u_slice[idx] + amount_u * factor).clamp(0.0, 1.0);
                    }
                }
            }
        }
    }

    /// Clear grid completely: $u = 1.0$, $v = 0.0$.
    pub fn clear(&mut self) {
        self.u_curr.as_mut_slice().fill(1.0);
        self.u_next.as_mut_slice().fill(1.0);
        self.v_curr.as_mut_slice().fill(0.0);
        self.v_next.as_mut_slice().fill(0.0);
    }

    /// Seed field with random spots using branchless PRNG and gentle default concentration.
    pub fn perturb(&mut self, spots: usize) {
        self.perturb_soft(spots, 0.42, -0.18);
    }

    /// Seed field with customizable intensity and falloff (ideal for serene wallpaper ambient drift).
    pub fn perturb_soft(&mut self, spots: usize, amount_v: f32, amount_u: f32) {
        for _ in 0..spots {
            let rand_val = self.next_random_u64();
            let cx = ((rand_val & 0xFFFF) as usize) % GRID_WIDTH;
            let cy = (((rand_val >> 16) & 0xFFFF) as usize) % GRID_HEIGHT;
            let radius = 6 + (((rand_val >> 32) & 0x0F) as usize);

            self.inject(cx, cy, radius, amount_v, amount_u);
        }
    }

    /// Seed archetypal geometry tailored for a given preset in 16:10 format.
    pub fn seed_preset_pattern(&mut self, preset_id: u32) {
        self.clear();
        self.config = SimulationConfig::from_preset_id(preset_id);

        let cx = GRID_WIDTH / 2; // 320
        let cy = GRID_HEIGHT / 2; // 200

        match preset_id {
            // Mitosis: Seed two compact squares near center
            0 => {
                for y in (cy - 15)..(cy + 15) {
                    for x in (cx - 15)..(cx + 15) {
                        let idx = (y.rem_euclid(GRID_HEIGHT)) * GRID_WIDTH + (x.rem_euclid(GRID_WIDTH));
                        self.u_curr[idx] = 0.5;
                        self.v_curr[idx] = 0.25;
                    }
                }
                self.perturb(6);
            }
            // Solitons: Seed a grid of tiny dots across 16:10 canvas
            1 => {
                for &sy in &[cy - 80, cy, cy + 80] {
                    for &sx in &[cx - 120, cx, cx + 120] {
                        self.inject(sx, sy, 8, 0.9, -0.5);
                    }
                }
            }
            // Coral: Central cluster + corner seeds
            2 => {
                self.inject(cx, cy, 24, 0.9, -0.5);
                self.inject(cx / 2, cy / 2, 14, 0.8, -0.4);
                self.inject(cx + cx / 2, cy + cy / 2, 14, 0.8, -0.4);
            }
            // Labyrinth: Multiple small seed clusters
            3 => {
                for i in 0..16 {
                    let angle = (i as f32) * std::f32::consts::PI * 2.0 / 16.0;
                    let radius_x = 130.0;
                    let radius_y = 85.0;
                    let x = ((cx as f32) + radius_x * angle.cos()) as usize;
                    let y = ((cy as f32) + radius_y * angle.sin()) as usize;
                    self.inject(x, y, 10, 0.85, -0.4);
                }
            }
            // Chaos: Asymmetrical wave injection
            4 => {
                self.inject(cx, cy, 32, 0.9, -0.5);
                self.inject(cx + 80, cy - 40, 18, 0.8, -0.3);
                self.perturb(8);
            }
            // Pulsating rings or other presets
            _ => {
                self.inject(cx, cy, 20, 0.9, -0.5);
                self.perturb(10);
            }
        }
    }

    /// Count cells with active morphogen concentration ($v > 0.08$).
    pub fn count_active_cells(&self) -> usize {
        self.v_curr
            .as_slice()
            .iter()
            .filter(|&&val| val > 0.08)
            .count()
    }

    /// Average morphogen concentration $V$.
    pub fn mean_concentration_v(&self) -> f32 {
        let sum: f32 = self.v_curr.as_slice().iter().sum();
        sum / (TOTAL_CELLS as f32)
    }

    /// Direct slice view of $U$ concentration field (read-only).
    pub fn u_field(&self) -> &[f32] {
        self.u_curr.as_slice()
    }

    /// Direct slice view of $V$ concentration field (read-only).
    pub fn v_field(&self) -> &[f32] {
        self.v_curr.as_slice()
    }
}

impl Default for LatticeGrid {
    fn default() -> Self {
        Self::new()
    }
}
