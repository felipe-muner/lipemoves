// Usage: swift mask.swift <input.jpg> <output-mask.png>
// Writes a grayscale mask (white = person) at the input's full size,
// using Apple's Vision foreground instance mask.
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

let handler = VNImageRequestHandler(url: inURL, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let obs = req.results?.first else { print("no foreground"); exit(1) }
let buf = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
let ci = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
let cs = CGColorSpaceCreateDeviceGray()
guard let cg = ctx.createCGImage(ci, from: ci.extent, format: .L8, colorSpace: cs) else { exit(2) }
let dest = CGImageDestinationCreateWithURL(outURL as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, cg, nil)
CGImageDestinationFinalize(dest)
print("ok \(cg.width)x\(cg.height) instances=\(obs.allInstances.count)")
