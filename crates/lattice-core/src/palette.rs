/// Color palette manager and 256-entry Look-Up Tables (LUT).
///
/// Precomputes packed 32-bit RGBA pixel words to allow single-instruction
/// 32-bit pixel writes during frame rendering, eliminating per-pixel branching
/// and floating-point conversions.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PaletteType {
    Cyberpunk = 0,
    Bioluminescence = 1,
    Magma = 2,
    AcidMatrix = 3,
    Vaporwave = 4,
}

impl PaletteType {
    pub fn from_u32(val: u32) -> Self {
        match val {
            0 => PaletteType::Cyberpunk,
            1 => PaletteType::Bioluminescence,
            2 => PaletteType::Magma,
            3 => PaletteType::AcidMatrix,
            4 => PaletteType::Vaporwave,
            _ => PaletteType::Cyberpunk,
        }
    }
}

pub struct ColorPalette {
    /// 256 precomputed little-endian RGBA32 values: `[R, G, B, A]` in byte order.
    lut: [u32; 256],
}

impl ColorPalette {
    pub fn new(palette_type: PaletteType) -> Self {
        let mut lut = [0u32; 256];
        let stops = Self::get_stops(palette_type);

        for i in 0..256 {
            let t = i as f32 / 255.0;
            let (r, g, b) = Self::interpolate_stops(&stops, t);
            // In little-endian, [r, g, b, 255] stored as u32 results in r at byte 0, g at 1, b at 2, a at 3.
            lut[i] = u32::from_le_bytes([r, g, b, 255]);
        }

        Self { lut }
    }

    #[inline(always)]
    pub fn get_pixel_u32(&self, index: usize) -> u32 {
        self.lut[index & 0xFF]
    }

    fn get_stops(palette_type: PaletteType) -> Vec<(f32, [u8; 3])> {
        match palette_type {
            PaletteType::Cyberpunk => vec![
                (0.00, [6, 8, 18]),
                (0.20, [22, 12, 45]),
                (0.45, [0, 160, 225]),
                (0.75, [180, 25, 130]),
                (1.00, [205, 55, 160]),
            ],
            PaletteType::Bioluminescence => vec![
                (0.00, [2, 6, 18]),
                (0.25, [0, 60, 90]),
                (0.50, [0, 230, 175]),
                (0.80, [40, 180, 255]),
                (1.00, [240, 255, 255]),
            ],
            PaletteType::Magma => vec![
                (0.00, [10, 6, 12]),
                (0.25, [160, 12, 35]),
                (0.55, [255, 100, 0]),
                (0.85, [255, 215, 30]),
                (1.00, [255, 255, 255]),
            ],
            PaletteType::AcidMatrix => vec![
                (0.00, [4, 8, 4]),
                (0.25, [10, 65, 20]),
                (0.55, [35, 210, 60]),
                (0.85, [160, 255, 30]),
                (1.00, [235, 255, 230]),
            ],
            PaletteType::Vaporwave => vec![
                (0.00, [18, 8, 32]),
                (0.30, [110, 25, 150]),
                (0.60, [235, 50, 125]),
                (0.85, [255, 160, 60]),
                (1.00, [255, 245, 180]),
            ],
        }
    }

    fn interpolate_stops(stops: &[(f32, [u8; 3])], t: f32) -> (u8, u8, u8) {
        if t <= stops[0].0 {
            let [r, g, b] = stops[0].1;
            return (r, g, b);
        }
        if t >= stops[stops.len() - 1].0 {
            let [r, g, b] = stops[stops.len() - 1].1;
            return (r, g, b);
        }

        for i in 0..stops.len() - 1 {
            let (pos0, color0) = stops[i];
            let (pos1, color1) = stops[i + 1];

            if t >= pos0 && t <= pos1 {
                let factor = (t - pos0) / (pos1 - pos0);
                let r = (color0[0] as f32 + factor * (color1[0] as f32 - color0[0] as f32)).round() as u8;
                let g = (color0[1] as f32 + factor * (color1[1] as f32 - color0[1] as f32)).round() as u8;
                let b = (color0[2] as f32 + factor * (color1[2] as f32 - color0[2] as f32)).round() as u8;
                return (r, g, b);
            }
        }

        let [r, g, b] = stops[0].1;
        (r, g, b)
    }
}
