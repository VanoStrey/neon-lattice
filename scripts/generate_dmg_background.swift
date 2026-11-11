#!/usr/bin/env swift
import Cocoa

let width: CGFloat = 600
let height: CGFloat = 400
let scale: CGFloat = 2.0 // Retina 2x

let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(
    data: nil,
    width: Int(width * scale),
    height: Int(height * scale),
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else {
    print("❌ Failed to create CoreGraphics context.")
    exit(1)
}

ctx.scaleBy(x: scale, y: scale)

// 1. Deep Obsidian Gradient Background
let bgColors = [
    NSColor(red: 0.03, green: 0.04, blue: 0.07, alpha: 1.0).cgColor,
    NSColor(red: 0.06, green: 0.08, blue: 0.13, alpha: 1.0).cgColor
] as CFArray
let bgLocations: [CGFloat] = [0.0, 1.0]
if let bgGrad = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: bgLocations) {
    ctx.drawLinearGradient(bgGrad, start: CGPoint(x: 0, y: height), end: CGPoint(x: 0, y: 0), options: [])
}

// 2. Subtle Cyberpunk Grid Lines
ctx.saveGState()
ctx.setLineWidth(1.0)
ctx.setStrokeColor(NSColor(red: 0.0, green: 0.85, blue: 1.0, alpha: 0.035).cgColor)
for x in stride(from: CGFloat(0), through: width, by: 24) {
    ctx.move(to: CGPoint(x: x, y: 0))
    ctx.addLine(to: CGPoint(x: x, y: height))
}
for y in stride(from: CGFloat(0), through: height, by: 24) {
    ctx.move(to: CGPoint(x: 0, y: y))
    ctx.addLine(to: CGPoint(x: width, y: y))
}
ctx.strokePath()
ctx.restoreGState()

// 3. Central Ambient Glow
ctx.saveGState()
let glowColors = [
    NSColor(red: 0.0, green: 0.9, blue: 1.0, alpha: 0.08).cgColor,
    NSColor(red: 1.0, green: 0.0, blue: 0.6, alpha: 0.04).cgColor,
    NSColor.clear.cgColor
] as CFArray
let glowLocations: [CGFloat] = [0.0, 0.45, 1.0]
if let glowGrad = CGGradient(colorsSpace: colorSpace, colors: glowColors, locations: glowLocations) {
    ctx.drawRadialGradient(glowGrad, startCenter: CGPoint(x: 300, y: 215), startRadius: 0, endCenter: CGPoint(x: 300, y: 215), endRadius: 280, options: [])
}
ctx.restoreGState()

// 4. Icon Target Pods (Subtle glowing rounded frames)
let iconSize: CGFloat = 120
let appPodCenter = CGPoint(x: 145, y: 205)
let dropPodCenter = CGPoint(x: 455, y: 205)

func drawPod(center: CGPoint, accentColor: NSColor) {
    ctx.saveGState()
    let rect = CGRect(x: center.x - iconSize/2 - 10, y: center.y - iconSize/2 - 10, width: iconSize + 20, height: iconSize + 20)
    let path = CGPath(roundedRect: rect, cornerWidth: 26, cornerHeight: 26, transform: nil)
    
    // Fill subtle dark tint
    ctx.setFillColor(NSColor(white: 0.12, alpha: 0.35).cgColor)
    ctx.addPath(path)
    ctx.fillPath()
    
    // Glowing border
    ctx.setShadow(offset: .zero, blur: 12, color: accentColor.withAlphaComponent(0.40).cgColor)
    ctx.setStrokeColor(accentColor.withAlphaComponent(0.30).cgColor)
    ctx.setLineWidth(1.5)
    ctx.addPath(path)
    ctx.strokePath()
    ctx.restoreGState()
}

drawPod(center: appPodCenter, accentColor: NSColor(red: 0.0, green: 0.9, blue: 1.0, alpha: 1.0))
drawPod(center: dropPodCenter, accentColor: NSColor(red: 1.0, green: 0.1, blue: 0.6, alpha: 1.0))

// 5. Connecting Neon Arrow
ctx.saveGState()
let arrowStartX: CGFloat = 226
let arrowEndX: CGFloat = 374
let arrowY: CGFloat = 205

// Glow backing
ctx.setShadow(offset: .zero, blur: 10, color: NSColor(red: 0.0, green: 0.9, blue: 1.0, alpha: 0.5).cgColor)

// Gradient line
let lineColors = [
    NSColor(red: 0.0, green: 0.9, blue: 1.0, alpha: 0.7).cgColor,
    NSColor(red: 1.0, green: 0.1, blue: 0.6, alpha: 0.7).cgColor
] as CFArray
if let lineGrad = CGGradient(colorsSpace: colorSpace, colors: lineColors, locations: [0.0, 1.0]) {
    // Draw horizontal dashed or solid connector
    let linePath = CGMutablePath()
    linePath.move(to: CGPoint(x: arrowStartX, y: arrowY))
    linePath.addLine(to: CGPoint(x: arrowEndX - 8, y: arrowY))
    
    ctx.setLineWidth(3.0)
    ctx.setLineCap(.round)
    ctx.replacePathWithStrokedPath()
    ctx.clip()
    ctx.drawLinearGradient(lineGrad, start: CGPoint(x: arrowStartX, y: arrowY), end: CGPoint(x: arrowEndX, y: arrowY), options: [])
}
ctx.restoreGState()

// Arrowhead
ctx.saveGState()
ctx.setShadow(offset: .zero, blur: 8, color: NSColor(red: 1.0, green: 0.1, blue: 0.6, alpha: 0.6).cgColor)
let arrowHead = CGMutablePath()
arrowHead.move(to: CGPoint(x: arrowEndX - 8, y: arrowY + 9))
arrowHead.addLine(to: CGPoint(x: arrowEndX + 8, y: arrowY))
arrowHead.addLine(to: CGPoint(x: arrowEndX - 8, y: arrowY - 9))
arrowHead.closeSubpath()
ctx.setFillColor(NSColor(red: 1.0, green: 0.1, blue: 0.6, alpha: 0.85).cgColor)
ctx.addPath(arrowHead)
ctx.fillPath()
ctx.restoreGState()

// 6. Typography
let titleFont = NSFont.systemFont(ofSize: 22, weight: .bold)
let titleAttrs: [NSAttributedString.Key: Any] = [
    .font: titleFont,
    .foregroundColor: NSColor.white
]
let titleStr = "NEON WALLPAPER"
let titleSize = (titleStr as NSString).size(withAttributes: titleAttrs)
let titleRect = CGRect(x: (width - titleSize.width) / 2, y: height - 58, width: titleSize.width, height: titleSize.height)

// Title Glow
ctx.saveGState()
ctx.setShadow(offset: .zero, blur: 14, color: NSColor(red: 0.0, green: 0.9, blue: 1.0, alpha: 0.45).cgColor)
(titleStr as NSString).draw(in: titleRect, withAttributes: titleAttrs)
ctx.restoreGState()

let subFont = NSFont.monospacedSystemFont(ofSize: 11, weight: .medium)
let subAttrs: [NSAttributedString.Key: Any] = [
    .font: subFont,
    .foregroundColor: NSColor(red: 0.0, green: 0.85, blue: 1.0, alpha: 0.70)
]
let subStr = "REAL-TIME METAL GPU SIMULATION"
let subSize = (subStr as NSString).size(withAttributes: subAttrs)
let subRect = CGRect(x: (width - subSize.width) / 2, y: height - 80, width: subSize.width, height: subSize.height)
(subStr as NSString).draw(in: subRect, withAttributes: subAttrs)

// Instructions between pods
let instFont = NSFont.systemFont(ofSize: 11, weight: .semibold)
let instAttrs: [NSAttributedString.Key: Any] = [
    .font: instFont,
    .foregroundColor: NSColor(white: 0.75, alpha: 0.80)
]
let instStr = "DRAG TO INSTALL"
let instSize = (instStr as NSString).size(withAttributes: instAttrs)
let instRect = CGRect(x: (width - instSize.width) / 2, y: arrowY - 32, width: instSize.width, height: instSize.height)
(instStr as NSString).draw(in: instRect, withAttributes: instAttrs)

// Footer
let footFont = NSFont.monospacedSystemFont(ofSize: 10, weight: .regular)
let footAttrs: [NSAttributedString.Key: Any] = [
    .font: footFont,
    .foregroundColor: NSColor(white: 0.40, alpha: 0.60)
]
let footStr = "Apple Silicon Native (M1/M2/M3/M4) • macOS 13+"
let footSize = (footStr as NSString).size(withAttributes: footAttrs)
let footRect = CGRect(x: (width - footSize.width) / 2, y: 22, width: footSize.width, height: footSize.height)
(footStr as NSString).draw(in: footRect, withAttributes: footAttrs)

// 7. Save output PNG
guard let cgImage = ctx.makeImage() else {
    print("❌ Failed to create CGImage.")
    exit(1)
}

let rep = NSBitmapImageRep(cgImage: cgImage)
rep.size = NSSize(width: width, height: height) // 600x400 point logical size
guard let pngData = rep.representation(using: .png, properties: [:]) else {
    print("❌ Failed to encode PNG.")
    exit(1)
}

let outputPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "background.png"
let outURL = URL(fileURLWithPath: outputPath)
try pngData.write(to: outURL)
print("✔ Generated DMG background: \(outputPath) (\(Int(width * scale))x\(Int(height * scale)) @2x)")
