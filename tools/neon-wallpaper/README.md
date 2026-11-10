# 🌌 NEON-WALLPAPER // Native macOS Apple Silicon Live Wallpaper

> **Infinite Real-Time Reaction-Diffusion Simulation Engine** powered by Apple Silicon Metal GPU Compute Shaders.  
> Designed exclusively for MacBooks with Apple Silicon (M1 / M2 / M3 / M4) on macOS 13+.

---

## ⚡ Highlights

- **Infinite Real-Time Simulation**: 300 simulation substeps/sec across 256,000 cells ($640 \times 400$ 16:10 field) with zero video looping.
- **Metal GPU Hardware Shaders**: 100% computed on GPU via Unified Memory; CPU usage remains $< 2\%$.
- **Native 16:10 MacBook Retina Resolution**: Direct bilinear reconstruction up to $2560 \times 1600$ without distortion or letterboxing.
- **Layered N-Body Gravitational Kinematics**:
  - 3 autonomous drift cursors with long sweeping random arcs (5s to 11s duration).
  - Newtonian gravity and slingshot maneuvers (up to $+90\%$ speed surges).
  - Dynamic breathing brush radius proportional to simulation space coverage ($10\text{px} \to 50\text{px}$).
  - Elastic anti-sticking core preventing cursor clumping.
- **Intelligent Power Management**: Zero battery drain — automatically suspends (`0.0% CPU / 0.0% GPU`) on screen sleep, lock, or clamshell close.
- **Zero Finder Interference**: Sits at WindowServer Desktop Layer `-2147483604`, preserving 100% desktop icon interaction and Spaces swipe animations.

---

## 🚀 One-Command Quick Install

To build, codesign, and launch the wallpaper on any M-series MacBook:

```bash
./install.sh
```

### Advanced Installation Options:

```bash
./install.sh --start         # Build and start immediately (default)
./install.sh --autostart     # Build, start, and enable automatic launch on macOS login
./install.sh --no-start      # Install CLI and Mac App only without starting daemon
./install.sh --uninstall     # Cleanly remove live wallpaper, CLI, and LaunchAgent
```

---

## 🎮 How to Control

### From Terminal (CLI):

```bash
neon-wallpaper status            # Show real-time FPS, GPU compute, PID, and RAM usage
neon-wallpaper stop              # Pause / stop wallpaper
neon-wallpaper start             # Start wallpaper in background
neon-wallpaper toggle            # Toggle wallpaper on / off
neon-wallpaper autostart enable  # Enable autostart on system login
neon-wallpaper autostart disable # Disable autostart on system login
neon-wallpaper uninstall         # Completely remove from system
```

### From macOS GUI:

- **Spotlight Search**: Press `Cmd + Space`, type `Neon Wallpaper`, and hit `Enter` to instantly start or toggle the wallpaper!
- **Applications**: Open `~/Applications/NeonWallpaper.app` directly from Finder or Launchpad.
- **Login Items**: Add `NeonWallpaper.app` to **System Settings $\to$ General $\to$ Login Items** if you prefer macOS GUI configuration over CLI.

---

## 🛠️ Requirements

- macOS 13.0 (Ventura) or newer
- Apple Silicon Mac (M1, M2, M3, M4, Pro, Max, Ultra)
- Swift Compiler (included with standard Apple Command Line Tools: `xcode-select --install`)
