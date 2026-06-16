// person-matte: read a video, run Apple Vision person segmentation on every
// frame, and write a grayscale matte video (white = person, black = background)
// at the clip's DISPLAY orientation/size and frame rate. Feed the matte into
// ffmpeg (alphamerge) to put the person in FRONT of composited background art.
//
// Build:  swiftc -O scripts/person-matte.swift -o scripts/person-matte
// Run:    scripts/person-matte <input.mov> <matte.mov>
import AVFoundation
import Vision
import CoreVideo
import Foundation

func die(_ m: String) -> Never { FileHandle.standardError.write((m + "\n").data(using: .utf8)!); exit(1) }

let args = CommandLine.arguments
guard args.count == 3 else { die("usage: person-matte <input> <matteOut>") }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: outURL)

let asset = AVAsset(url: inURL)
guard let track = asset.tracks(withMediaType: .video).first else { die("no video track") }

// Display-oriented size + frame rate via a video composition (applies rotation).
let vc = AVMutableVideoComposition(propertiesOf: asset)
let W = Int(vc.renderSize.width.rounded())
let H = Int(vc.renderSize.height.rounded())
let fps = track.nominalFrameRate > 0 ? track.nominalFrameRate : 30
FileHandle.standardError.write("matte: \(W)x\(H) @ \(fps)fps\n".data(using: .utf8)!)

// Reader: display-oriented BGRA frames.
guard let reader = try? AVAssetReader(asset: asset) else { die("reader init failed") }
let readerOut = AVAssetReaderVideoCompositionOutput(
    videoTracks: asset.tracks(withMediaType: .video),
    videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
readerOut.videoComposition = vc
readerOut.alwaysCopiesSampleData = false
reader.add(readerOut)

// Writer: ProRes422 grayscale-in-BGRA matte (lossless-ish edges).
guard let writer = try? AVAssetWriter(outputURL: outURL, fileType: .mov) else { die("writer init failed") }
let writerIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.proRes422,
    AVVideoWidthKey: W,
    AVVideoHeightKey: H])
writerIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: writerIn,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: W,
        kCVPixelBufferHeightKey as String: H])
writer.add(writerIn)

let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8

guard reader.startReading() else { die("startReading failed: \(reader.error?.localizedDescription ?? "?")") }
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var frames = 0
while let sample = readerOut.copyNextSampleBuffer() {
    guard let frame = CMSampleBufferGetImageBuffer(sample) else { continue }
    let pts = CMSampleBufferGetPresentationTimeStamp(sample)

    let handler = VNImageRequestHandler(cvPixelBuffer: frame, options: [:])
    try? handler.perform([req])
    guard let mask = (req.results?.first)?.pixelBuffer else { continue }

    // Pull an output buffer and fill B=G=R=mask (nearest-neighbour upscaled).
    var outBuf: CVPixelBuffer?
    guard let pool = adaptor.pixelBufferPool,
          CVPixelBufferPoolCreatePixelBuffer(nil, pool, &outBuf) == kCVReturnSuccess,
          let dst = outBuf else { continue }

    CVPixelBufferLockBaseAddress(mask, .readOnly)
    CVPixelBufferLockBaseAddress(dst, [])
    let mW = CVPixelBufferGetWidth(mask), mH = CVPixelBufferGetHeight(mask)
    let mRow = CVPixelBufferGetBytesPerRow(mask)
    let dRow = CVPixelBufferGetBytesPerRow(dst)
    let mBase = CVPixelBufferGetBaseAddress(mask)!.assumingMemoryBound(to: UInt8.self)
    let dBase = CVPixelBufferGetBaseAddress(dst)!.assumingMemoryBound(to: UInt8.self)
    for y in 0..<H {
        let my = y * mH / H
        let dRowP = dBase + y * dRow
        let mRowP = mBase + my * mRow
        for x in 0..<W {
            let v = mRowP[x * mW / W]
            let o = x * 4
            dRowP[o] = v; dRowP[o+1] = v; dRowP[o+2] = v; dRowP[o+3] = 255
        }
    }
    CVPixelBufferUnlockBaseAddress(dst, [])
    CVPixelBufferUnlockBaseAddress(mask, .readOnly)

    while !writerIn.isReadyForMoreMediaData { usleep(2000) }
    adaptor.append(dst, withPresentationTime: pts)
    frames += 1
}

writerIn.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
if writer.status != .completed { die("writer failed: \(writer.error?.localizedDescription ?? "?")") }
FileHandle.standardError.write("matte: wrote \(frames) frames -> \(outURL.path)\n".data(using: .utf8)!)
