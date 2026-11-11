import AppKit
import CoreGraphics

func createMasterIcon() -> NSImage {
    let size: CGFloat = 1024
    let img = NSImage(size: NSSize(width: size, height: size))
    img.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }

    // 1. macOS Squircle Path (standard inset = 82px on 1024x1024)
    let margin: CGFloat = 82
    let iconRect = CGRect(x: margin, y: margin, width: size - 2 * margin, height: size - 2 * margin)
    let cornerRadius: CGFloat = (size - 2 * margin) * 0.2237 // ~192px

    let squirclePath = CGPath(roundedRect: iconRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)

    // Subtle drop shadow behind squircle
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -24), blur: 48, color: NSColor.black.withAlphaComponent(0.65).cgColor)
    ctx.addPath(squirclePath)
    ctx.setFillColor(NSColor(calibratedRed: 0.03, green: 0.04, blue: 0.08, alpha: 1.0).cgColor)
    ctx.fillPath()
    ctx.restoreGState()

    // Clip to squircle for inner drawing
    ctx.saveGState()
    ctx.addPath(squirclePath)
    ctx.clip()

    // 2. Deep Obsidian Gradient Background
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bgColors = [
        NSColor(calibratedRed: 0.03, green: 0.04, blue: 0.09, alpha: 1.0).cgColor,
        NSColor(calibratedRed: 0.06, green: 0.08, blue: 0.16, alpha: 1.0).cgColor,
        NSColor(calibratedRed: 0.02, green: 0.03, blue: 0.07, alpha: 1.0).cgColor
    ] as CFArray
    let bgLocations: [CGFloat] = [0.0, 0.55, 1.0]
    if let gradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: bgLocations) {
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 512, y: 942), end: CGPoint(x: 512, y: 82), options: [])
    }

    // 3. Central Ambient Radial Glow
    let glowColors = [
        NSColor(calibratedRed: 0.0, green: 0.94, blue: 1.0, alpha: 0.25).cgColor,
        NSColor(calibratedRed: 0.85, green: 0.15, blue: 0.70, alpha: 0.12).cgColor,
        NSColor.clear.cgColor
    ] as CFArray
    let glowLocations: [CGFloat] = [0.0, 0.45, 1.0]
    if let glowGradient = CGGradient(colorsSpace: colorSpace, colors: glowColors, locations: glowLocations) {
        ctx.drawRadialGradient(glowGradient, startCenter: CGPoint(x: 512, y: 512), startRadius: 0, endCenter: CGPoint(x: 512, y: 512), endRadius: 360, options: [])
    }

    // 4. Concentric Lattice Wave Rings
    ctx.setLineWidth(2.5)
    let radii: [CGFloat] = [80, 150, 225, 300]
    for (idx, r) in radii.enumerated() {
        ctx.saveGState()
        let alpha: CGFloat = 0.15 + CGFloat(idx) * 0.08
        if idx % 2 == 0 {
            ctx.setStrokeColor(NSColor(calibratedRed: 0.0, green: 0.94, blue: 1.0, alpha: alpha).cgColor)
        } else {
            ctx.setStrokeColor(NSColor(calibratedRed: 0.95, green: 0.20, blue: 0.75, alpha: alpha).cgColor)
        }
        ctx.strokeEllipse(in: CGRect(x: 512 - r, y: 512 - r, width: 2 * r, height: 2 * r))
        ctx.restoreGState()
    }

    // 5. Hexagonal / Diamond Lattice Nodes & Beams
    let center = CGPoint(x: 512, y: 512)
    let hexRadius: CGFloat = 160
    var hexPoints: [CGPoint] = []
    for i in 0..<6 {
        let angle = CGFloat(i) * CGFloat.pi / 3.0 - CGFloat.pi / 6.0
        let pt = CGPoint(x: center.x + hexRadius * cos(angle), y: center.y + hexRadius * sin(angle))
        hexPoints.append(pt)
    }

    // Draw connecting lattice lines
    for i in 0..<6 {
        let p1 = hexPoints[i]
        let p2 = hexPoints[(i + 1) % 6]

        // Outer rim
        ctx.setLineWidth(5.0)
        ctx.setStrokeColor(NSColor(calibratedRed: 0.0, green: 0.94, blue: 1.0, alpha: 0.85).cgColor)
        ctx.strokeLineSegments(between: [p1, p2])

        // Spokes to center
        ctx.setLineWidth(3.0)
        let spokeAlpha: CGFloat = (i % 2 == 0) ? 0.75 : 0.45
        ctx.setStrokeColor(NSColor(calibratedRed: 0.92, green: 0.22, blue: 0.72, alpha: spokeAlpha).cgColor)
        ctx.strokeLineSegments(between: [center, p1])

        // Cross diagonals
        let pOpposite = hexPoints[(i + 3) % 6]
        ctx.setLineWidth(1.5)
        ctx.setStrokeColor(NSColor.white.withAlphaComponent(0.20).cgColor)
        ctx.strokeLineSegments(between: [p1, pOpposite])
    }

    // Secondary inner diamond
    let innerRadius: CGFloat = 75
    for i in 0..<6 {
        let angle = CGFloat(i) * CGFloat.pi / 3.0
        let pt = CGPoint(x: center.x + innerRadius * cos(angle), y: center.y + innerRadius * sin(angle))

        ctx.setLineWidth(2.5)
        ctx.setStrokeColor(NSColor(calibratedRed: 0.0, green: 0.94, blue: 1.0, alpha: 0.9).cgColor)
        let nextPt = CGPoint(x: center.x + innerRadius * cos(CGFloat(i + 1) * CGFloat.pi / 3.0),
                             y: center.y + innerRadius * sin(CGFloat(i + 1) * CGFloat.pi / 3.0))
        ctx.strokeLineSegments(between: [pt, nextPt])
    }

    // 6. Glowing Nodes (Circles)
    for (idx, pt) in hexPoints.enumerated() {
        let isAccent = (idx % 2 == 1)
        let nodeColor = isAccent ? NSColor(calibratedRed: 1.0, green: 0.25, blue: 0.75, alpha: 1.0) : NSColor(calibratedRed: 0.0, green: 0.95, blue: 1.0, alpha: 1.0)

        // Outer halo
        ctx.setFillColor(nodeColor.withAlphaComponent(0.35).cgColor)
        ctx.fillEllipse(in: CGRect(x: pt.x - 14, y: pt.y - 14, width: 28, height: 28))

        // Core white-hot dot
        ctx.setFillColor(NSColor.white.cgColor)
        ctx.fillEllipse(in: CGRect(x: pt.x - 6, y: pt.y - 6, width: 12, height: 12))
    }

    // Central Core Hotspot
    ctx.setFillColor(NSColor(calibratedRed: 0.0, green: 0.95, blue: 1.0, alpha: 0.4).cgColor)
    ctx.fillEllipse(in: CGRect(x: center.x - 24, y: center.y - 24, width: 48, height: 48))
    ctx.setFillColor(NSColor(calibratedRed: 1.0, green: 0.3, blue: 0.8, alpha: 0.8).cgColor)
    ctx.fillEllipse(in: CGRect(x: center.x - 12, y: center.y - 12, width: 24, height: 24))
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.fillEllipse(in: CGRect(x: center.x - 6, y: center.y - 6, width: 12, height: 12))

    // 7. Subtle 1px Specular Border / Rim Highlight on Squircle
    ctx.setLineWidth(2.0)
    ctx.setStrokeColor(NSColor.white.withAlphaComponent(0.22).cgColor)
    ctx.addPath(squirclePath)
    ctx.strokePath()

    ctx.restoreGState()
    img.unlockFocus()
    return img
}

let masterImg = createMasterIcon()

let iconsetDir = URL(fileURLWithPath: "/tmp/NeonWallpaper.iconset")
try? FileManager.default.removeItem(at: iconsetDir)
try FileManager.default.createDirectory(at: iconsetDir, withIntermediateDirectories: true)

let targets: [(String, CGFloat)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for (filename, pxSize) in targets {
    let destSize = NSSize(width: pxSize, height: pxSize)
    let resized = NSImage(size: destSize)
    resized.lockFocus()
    NSGraphicsContext.current?.imageInterpolation = .high
    masterImg.draw(in: NSRect(origin: .zero, size: destSize),
                   from: NSRect(origin: .zero, size: masterImg.size),
                   operation: .copy,
                   fraction: 1.0)
    resized.unlockFocus()

    guard let tiff = resized.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let pngData = rep.representation(using: .png, properties: [:]) else {
        continue
    }
    let fileUrl = iconsetDir.appendingPathComponent(filename)
    try pngData.write(to: fileUrl)
}

print("Iconset created. Converting via iconutil...")
let task = Process()
task.launchPath = "/usr/bin/iconutil"
task.arguments = ["-c", "icns", "/tmp/NeonWallpaper.iconset", "-o", "tools/neon-wallpaper/AppIcon.icns"]
try task.run()
task.waitUntilExit()

if task.terminationStatus == 0 {
    print("✅ Successfully generated tools/neon-wallpaper/AppIcon.icns")
} else {
    print("❌ Failed to run iconutil")
    exit(1)
}
