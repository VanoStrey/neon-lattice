export type BrushMode = 'inject_v' | 'erase' | 'pulse' | 'vortex';

export interface PresetInfo {
  id: number;
  name: string;
  tagline: string;
  description: string;
  feed: number;
  kill: number;
  diffU: number;
  diffV: number;
  category: 'Morphogenesis' | 'Solitons' | 'Turbulence' | 'Waves';
}

export interface PaletteInfo {
  id: number;
  name: string;
  accent: string;
  gradient: string;
}

export interface SimulationTelemetry {
  fps: number;
  wasmComputeTimeMs: number;
  activeCells: number;
  stepCounter: number;
  meanV: number;
  totalMemoryBytes: number;
}

export interface SimulationState {
  isRunning: boolean;
  isWallpaperMode: boolean;
  isZenMode: boolean;
  presetId: number;
  paletteId: number;
  substeps: number;
  feed: number;
  kill: number;
  diffU: number;
  diffV: number;
  dt: number;
  brushRadius: number;
  brushStrength: number;
  brushMode: BrushMode;
}

export const PRESETS: PresetInfo[] = [
  {
    id: 0,
    name: 'Mitosis',
    tagline: 'Self-replicating cellular division',
    description: 'Dividing micro-colonies that continuously split and colonize space.',
    feed: 0.0367,
    kill: 0.0649,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Morphogenesis',
  },
  {
    id: 1,
    name: 'Solitons',
    tagline: 'Localized solitary wave packets',
    description: 'Particle-like solitary wave entities that bounce and preserve their shape.',
    feed: 0.0300,
    kill: 0.0620,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Solitons',
  },
  {
    id: 2,
    name: 'Coral Reef',
    tagline: 'Bio-branching fractal growth',
    description: 'Dense, branching dendritic structures resembling deep-sea coral.',
    feed: 0.0545,
    kill: 0.0620,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Morphogenesis',
  },
  {
    id: 3,
    name: 'Labyrinth',
    tagline: 'Organic finger mazes & worms',
    description: 'Turing pattern morphing into meandering paths and convoluted skin folds.',
    feed: 0.0580,
    kill: 0.0650,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Morphogenesis',
  },
  {
    id: 4,
    name: 'Chaos',
    tagline: 'Turbulent vortex cascades',
    description: 'Dynamic chemical turbulence with swirling spirals and continuous fluctuations.',
    feed: 0.0180,
    kill: 0.0510,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Turbulence',
  },
  {
    id: 5,
    name: 'Colonies',
    tagline: 'Pulsating bacteriophage spots',
    description: 'Discrete isolated spots that breathe and stabilize in hexagonal lattices.',
    feed: 0.0340,
    kill: 0.0650,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Morphogenesis',
  },
  {
    id: 6,
    name: 'Pulsating Rings',
    tagline: 'Expanding concentric wave fronts',
    description: 'Target pattern oscillations emitting concentric chemical waves.',
    feed: 0.0250,
    kill: 0.0600,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Waves',
  },
  {
    id: 7,
    name: 'Electric Waves',
    tagline: 'High-speed excitability filaments',
    description: 'Fast-moving wavefronts resembling neural action potentials.',
    feed: 0.0140,
    kill: 0.0470,
    diffU: 0.2097,
    diffV: 0.1050,
    category: 'Waves',
  },
];

export const PALETTES: PaletteInfo[] = [
  {
    id: 0,
    name: 'Neon Cyberpunk',
    accent: '#00f0ff',
    gradient: 'from-[#060812] via-[#00a0e1] to-[#cd37a0]',
  },
  {
    id: 1,
    name: 'Bioluminescence',
    accent: '#00f5d4',
    gradient: 'from-[#020612] via-[#0077b6] to-[#00f5d4]',
  },
  {
    id: 2,
    name: 'Solar Flare / Magma',
    accent: '#ff9e00',
    gradient: 'from-[#0a060c] via-[#d00000] to-[#ffba08]',
  },
  {
    id: 3,
    name: 'Acid Matrix',
    accent: '#39ff14',
    gradient: 'from-[#040804] via-[#007f3f] to-[#39ff14]',
  },
  {
    id: 4,
    name: 'Vaporwave Sunset',
    accent: '#ff00aa',
    gradient: 'from-[#120820] via-[#7b2cbf] to-[#ff85a1]',
  },
];
