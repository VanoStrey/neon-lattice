/// Simulation parameters and archetypal reaction-diffusion configurations.

#[derive(Debug, Clone, Copy)]
pub struct SimulationConfig {
    pub feed: f32,
    pub kill: f32,
    pub diff_u: f32,
    pub diff_v: f32,
    pub dt: f32,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self::mitosis()
    }
}

impl SimulationConfig {
    pub const DEFAULT_DIFF_U: f32 = 0.2097;
    pub const DEFAULT_DIFF_V: f32 = 0.1050;
    pub const DEFAULT_DT: f32 = 1.0;

    /// Cell division and splitting colonies
    pub const fn mitosis() -> Self {
        Self {
            feed: 0.0367,
            kill: 0.0649,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Moving particle-like solitary waves
    pub const fn solitons() -> Self {
        Self {
            feed: 0.0300,
            kill: 0.0620,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Organic branching coral reef patterns
    pub const fn coral() -> Self {
        Self {
            feed: 0.0545,
            kill: 0.0620,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Intricate organic finger labyrinth
    pub const fn labyrinth() -> Self {
        Self {
            feed: 0.0580,
            kill: 0.0650,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Swirling turbulent chemical chaos
    pub const fn chaos() -> Self {
        Self {
            feed: 0.0180,
            kill: 0.0510,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Stable pulsating spots and colonies
    pub const fn colonies() -> Self {
        Self {
            feed: 0.0340,
            kill: 0.0650,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Expanding and breathing circular waves
    pub const fn pulsating_rings() -> Self {
        Self {
            feed: 0.0250,
            kill: 0.0600,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    /// Fast excitable electric waves
    pub const fn electric_waves() -> Self {
        Self {
            feed: 0.0140,
            kill: 0.0470,
            diff_u: Self::DEFAULT_DIFF_U,
            diff_v: Self::DEFAULT_DIFF_V,
            dt: Self::DEFAULT_DT,
        }
    }

    pub fn from_preset_id(id: u32) -> Self {
        match id {
            0 => Self::mitosis(),
            1 => Self::solitons(),
            2 => Self::coral(),
            3 => Self::labyrinth(),
            4 => Self::chaos(),
            5 => Self::colonies(),
            6 => Self::pulsating_rings(),
            7 => Self::electric_waves(),
            _ => Self::mitosis(),
        }
    }
}
