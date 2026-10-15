import Foundation
import Vision
import ImageIO
let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNDetectBarcodesRequest()
request.symbologies = [.qr]
try VNImageRequestHandler(url: imageURL, options: [:]).perform([request])
let payloads = (request.results ?? []).compactMap { $0.payloadStringValue }
if payloads.count != 1 {fputs("Expected one QR payload, got \(payloads.count)\n", stderr); exit(1)}
print(payloads[0])
