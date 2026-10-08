export function validImageSignature(buffer: Uint8Array, mime: string) {
  return (
    (mime === "image/jpeg" &&
      buffer[0] === 255 &&
      buffer[1] === 216 &&
      buffer[2] === 255) ||
    (mime === "image/png" &&
      Buffer.from(buffer.subarray(0, 8)).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      )) ||
    (mime === "image/webp" &&
      Buffer.from(buffer.subarray(0, 4)).toString() === "RIFF" &&
      Buffer.from(buffer.subarray(8, 12)).toString() === "WEBP")
  );
}
