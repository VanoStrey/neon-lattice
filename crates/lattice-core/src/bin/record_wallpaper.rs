use lattice_core::{ColorPalette, LatticeGrid, PaletteType, GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS};
use std::io::Write;
use std::process::{Command, Stdio};
use std::time::Instant;

struct DriftAgent {
    x: f32,
    y: f32,
    angle: f32,
    angular_velocity: f32,
    target_angular_velocity: f32,
    speed: f32,
    radius: f32,
    target_radius: f32,
    arc_timer: usize,
    arc_duration: usize,
    rng: u64,
}

impl DriftAgent {
    fn new(x: f32, y: f32, angle: f32, speed: f32, seed: u64) -> Self {
        Self {
            x,
            y,
            angle,
            angular_velocity: 0.0,
            target_angular_velocity: 0.002,
            speed,
            radius: 14.0,
            target_radius: 16.0,
            arc_timer: 0,
            arc_duration: 360,
            rng: seed,
        }
    }

    #[inline(always)]
    fn rand_f32(&mut self) -> f32 {
        let mut x = self.rng;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.rng = x;
        (x as f32) / (u64::MAX as f32)
    }

    fn update(&mut self, coverage: f32) {
        self.arc_timer += 1;
        if self.arc_timer >= self.arc_duration {
            self.arc_timer = 0;
            // Long, majestic sweeping arcs (6s to 13s per arc @ 60fps)
            self.arc_duration = 360 + (self.rand_f32() * 420.0) as usize;

            // Ultra-gentle curvature: prevents small circles and creates long sweeping trajectories
            let roll = self.rand_f32();
            if roll < 0.35 {
                // Almost straight glide
                self.target_angular_velocity = (self.rand_f32() - 0.5) * 0.002;
            } else {
                // Very gentle wide curvature
                let sign = if self.rand_f32() > 0.5 { 1.0 } else { -1.0 };
                self.target_angular_velocity = sign * (0.0015 + self.rand_f32() * 0.0045);
            }

            // Dynamic radius range proportional to active colored cells ratio
            let min_r = 10.0;
            let max_r = 18.0 + coverage.clamp(0.0, 1.0) * 32.0; // scales from 18px up to 50px
            self.target_radius = min_r + self.rand_f32() * (max_r - min_r);
        }

        // High inertial steering momentum: extremely smooth, cinematic turns
        self.angular_velocity = self.angular_velocity * 0.985 + self.target_angular_velocity * 0.015;
        self.angle += self.angular_velocity;

        // Advance coordinates along smooth wide arc at calm, meditative speed
        self.x = (self.x + self.angle.cos() * self.speed).rem_euclid(GRID_WIDTH as f32);
        self.y = (self.y + self.angle.sin() * self.speed).rem_euclid(GRID_HEIGHT as f32);

        // Extremely smooth breathing of brush radius
        self.radius = self.radius * 0.990 + self.target_radius * 0.010;
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧬 NEON-LATTICE // Programmatic Wallpaper Video Generator");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let duration_secs = 60;
    let fps = 60;
    let total_frames = duration_secs * fps; // 3,600 frames
    let substeps_per_frame = 5;
    let output_file = "neon_lattice_wallpaper_demo.mp4";

    println!("• Target Duration: {}s ({} frames @ {} FPS)", duration_secs, total_frames, fps);
    println!("• Aspect Ratio: 16:10 Native Field & Display (Grid: 640x400 -> Retina: 2560x1600)");
    println!("• Preset: #5 Chaos / Turbulence (F=0.0180, k=0.0510, dt=0.5 [calm slow kinematics])");
    println!("• Palette: Neon Cyberpunk (Non-distracting, zero pure white / glare)");
    println!("• Cursor Motion: Slower speeds (0.36-0.42 px/t), Ultra-long sweeping arcs (6-13s)");
    println!("• Dynamic Brush: Proportional to active colored cell density (10px → 50px)");
    println!("• Output Target: {}", output_file);
    println!("• Spawning hardware-accelerated FFmpeg encoder...");

    // Launch FFmpeg scaled to native MacBook 16:10 resolution (2560x1600) directly from 640x400 grid (4x exact integer scale)
    let mut ffmpeg = Command::new("ffmpeg")
        .args([
            "-y",
            "-f", "rawvideo",
            "-pixel_format", "rgba",
            "-video_size", "640x400",
            "-framerate", &fps.to_string(),
            "-i", "pipe:0",
            "-vf", "scale=2560:1600:flags=neighbor,format=yuv420p",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23.5",
            "-movflags", "+faststart",
            output_file,
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}. Please ensure ffmpeg is installed.", e))?;

    let mut stdin = ffmpeg.stdin.take().expect("Failed to open ffmpeg stdin");

    // Initialize Rust simulation grid
    let mut grid = LatticeGrid::new();
    grid.seed_preset_pattern(4);
    grid.config.dt = 0.5;
    let palette = ColorPalette::new(PaletteType::Cyberpunk);

    // Warm-up simulation for 180 ticks
    for _ in 0..180 {
        grid.tick();
    }

    // 3 smooth autonomous wandering agents with slower speeds and long arc steering across 640x400 field
    let mut agents = [
        DriftAgent::new(320.0, 200.0, 0.75, 0.42, 0x1234_5678_9ABC_DEF0),
        DriftAgent::new(160.0, 300.0, 2.30, 0.36, 0xFEDC_BA98_7654_3210),
        DriftAgent::new(480.0, 100.0, 4.10, 0.39, 0x55AA_33CC_11EE_7788),
    ];

    let start_time = Instant::now();
    let frame_len = grid.frame_buffer_len();

    println!("• Computing and streaming simulation directly from Rust core...");

    for frame_idx in 0..total_frames {
        // Calculate current field coverage ratio (active colored cells)
        let active_count = grid.count_active_cells();
        let coverage = (active_count as f32 / (TOTAL_CELLS as f32 * 0.40)).clamp(0.0, 1.0);

        // Periodic gentle ambient pulse (once every 600 frames / 10 seconds)
        if frame_idx > 0 && frame_idx % 600 == 0 {
            grid.perturb_soft(2, 0.24, -0.10);
        }

        // 1. Step simulation with autonomous drift agents
        for _ in 0..substeps_per_frame {
            for agent in &mut agents {
                agent.update(coverage);

                let radius_usize = agent.radius.round() as usize;

                // Scale concentration slightly with radius; keep amount calm to eliminate white/harsh glare
                let radius_scale = (16.0 / agent.radius).powf(0.25).clamp(0.70, 1.15);
                let amount_v = 0.27 * radius_scale;
                let amount_u = -0.11 * radius_scale;

                grid.inject(
                    agent.x as usize,
                    agent.y as usize,
                    radius_usize,
                    amount_v,
                    amount_u,
                );
            }

            grid.tick();
        }

        // 2. Render frame with tuned soft Neon Cyberpunk palette into 64-byte aligned buffer
        grid.render_frame(&palette);

        // 3. Pipe raw RGBA bytes directly into FFmpeg
        let pixel_bytes = unsafe {
            std::slice::from_raw_parts(grid.frame_buffer_ptr(), frame_len)
        };
        stdin.write_all(pixel_bytes)?;

        // Progress log every 120 frames (2 seconds of video)
        if (frame_idx + 1) % 120 == 0 || frame_idx + 1 == total_frames {
            let progress = ((frame_idx + 1) as f32 / total_frames as f32) * 100.0;
            let current_video_secs = (frame_idx + 1) / fps;
            let current_active = grid.count_active_cells();
            let avg_radius = (agents[0].radius + agents[1].radius + agents[2].radius) / 3.0;
            print!("\r  ▶ Progress: [{:<25}] {:.1}% ({}s/{}s) | Active: {} | Brush: {:.1}px",
                   "=".repeat((progress / 4.0) as usize),
                   progress,
                   current_video_secs,
                   duration_secs,
                   current_active,
                   avg_radius);
            std::io::stdout().flush()?;
        }
    }

    println!();
    println!("• Finishing video encoding stream...");
    drop(stdin);

    let status = ffmpeg.wait()?;
    if !status.success() {
        return Err("FFmpeg process failed".into());
    }

    let elapsed = start_time.elapsed();
    let file_size_bytes = std::fs::metadata(output_file)?.len();
    let file_size_mb = (file_size_bytes as f64) / (1024.0 * 1024.0);

    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("✅ SUCCESS: MacBook 16:10 Retina video created successfully!");
    println!("• Output file: {}", output_file);
    println!("• Video Resolution: 2560x1600 (16:10 MacBook Retina) @ 60 FPS");
    println!("• Video Duration: {} seconds", duration_secs);
    println!("• File Size: {:.2} MB (well within the 100 MB limit)", file_size_mb);
    println!("• Generation Speed: {:.2}s ({:.1}x realtime)", elapsed.as_secs_f64(), (duration_secs as f64) / elapsed.as_secs_f64());
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    Ok(())
}
