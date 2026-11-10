#[cfg(test)]
mod tests {
    use crate::aligned::AlignedBuffer;
    use crate::grid::{LatticeGrid, GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS};
    use crate::palette::{ColorPalette, PaletteType};
    use crate::sim::SimulationConfig;

    #[test]
    fn test_aligned_buffer_64_byte_alignment() {
        let buf = AlignedBuffer::<f32>::zeroed(1024);
        let ptr_addr = buf.as_ptr() as usize;
        assert_eq!(ptr_addr % 64, 0, "Buffer pointer must align to 64-byte cache lines");
        assert_eq!(buf.len(), 1024);

        let byte_buf = AlignedBuffer::<u8>::filled(2048, 42);
        let byte_ptr = byte_buf.as_ptr() as usize;
        assert_eq!(byte_ptr % 64, 0, "Byte buffer must align to 64-byte boundary");
        assert_eq!(byte_buf[0], 42);
        assert_eq!(byte_buf[2047], 42);
    }

    #[test]
    fn test_grid_initialization_invariants() {
        let grid = LatticeGrid::new();
        assert_eq!(grid.width, GRID_WIDTH);
        assert_eq!(grid.height, GRID_HEIGHT);
        assert_eq!(grid.step_counter, 0);

        let u_slice = grid.u_field();
        let v_slice = grid.v_field();
        assert_eq!(u_slice.len(), TOTAL_CELLS);
        assert_eq!(v_slice.len(), TOTAL_CELLS);

        // Verify concentrations are bounded in [0.0, 1.0]
        for &u in u_slice {
            assert!((0.0..=1.0).contains(&u), "U must be within [0, 1], found {}", u);
        }
        for &v in v_slice {
            assert!((0.0..=1.0).contains(&v), "V must be within [0, 1], found {}", v);
        }
    }

    #[test]
    fn test_simulation_step_numerical_stability() {
        let mut grid = LatticeGrid::new();
        grid.config = SimulationConfig::mitosis();

        // Run 50 simulation steps
        for _ in 0..50 {
            grid.tick();
        }

        assert_eq!(grid.step_counter, 50);

        // Check for NaN, infinity, and boundary bounds
        for &u in grid.u_field() {
            assert!(!u.is_nan() && !u.is_infinite());
            assert!((0.0..=1.0).contains(&u));
        }
        for &v in grid.v_field() {
            assert!(!v.is_nan() && !v.is_infinite());
            assert!((0.0..=1.0).contains(&v));
        }
    }

    #[test]
    fn test_toroidal_boundary_wrapping() {
        let mut grid = LatticeGrid::new();
        grid.clear();

        // Inject at origin (0, 0) with radius 2
        grid.inject(0, 0, 2, 1.0, 0.0);

        let v = grid.v_field();
        let center_idx = 0;
        let right_idx = 1;
        let left_idx = GRID_WIDTH - 1;
        let bottom_idx = GRID_WIDTH;
        let top_idx = (GRID_HEIGHT - 1) * GRID_WIDTH;

        assert!(v[center_idx] > 0.0);
        assert!(v[right_idx] > 0.0);
        assert!(v[left_idx] > 0.0, "Left boundary wrap failed");
        assert!(v[bottom_idx] > 0.0);
        assert!(v[top_idx] > 0.0, "Top boundary wrap failed");
    }

    #[test]
    fn test_frame_buffer_rendering_zero_copy() {
        let mut grid = LatticeGrid::new();
        let palette = ColorPalette::new(PaletteType::Cyberpunk);

        grid.render_frame(&palette);

        let ptr = grid.frame_buffer_ptr();
        assert_eq!((ptr as usize) % 64, 0, "Frame buffer pointer must be 64-byte aligned");
        assert_eq!(grid.frame_buffer_len(), TOTAL_CELLS * 4);

        let pixels = unsafe { std::slice::from_raw_parts(ptr, grid.frame_buffer_len()) };

        // Every 4th byte is Alpha and must be 255 (0xFF)
        for i in (3..pixels.len()).step_by(4) {
            assert_eq!(pixels[i], 255, "Alpha channel must be 255");
        }
    }

    #[test]
    fn test_presets_loading() {
        let mut grid = LatticeGrid::new();
        for preset_id in 0..8 {
            grid.seed_preset_pattern(preset_id);
            assert!(grid.count_active_cells() > 0, "Preset {} should initialize with active cells", preset_id);
            grid.tick();
            assert!(grid.count_active_cells() > 0);
        }
    }

    #[test]
    fn test_clear_and_perturb() {
        let mut grid = LatticeGrid::new();
        grid.clear();
        assert_eq!(grid.count_active_cells(), 0);

        grid.perturb(5);
        assert!(grid.count_active_cells() > 0);
    }
}
