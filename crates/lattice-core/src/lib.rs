pub mod aligned;
pub mod grid;
pub mod palette;
pub mod sim;

#[cfg(test)]
mod tests;

pub use aligned::AlignedBuffer;
pub use grid::{LatticeGrid, FRAME_BUFFER_BYTES, GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS};
pub use palette::{ColorPalette, PaletteType};
pub use sim::SimulationConfig;
