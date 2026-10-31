import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const logoPath = path.join(assets, 'snapnear-logo.png');

/** Remove opaque white canvas + peach fringe around the orange squircle. */
async function clearWhiteBackground(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);
  const visited = new Uint8Array(width * height);

  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (r >= 235 && g >= 235 && b >= 235) return true;
    if (min >= 200 && sat < 0.25) return true;
    if (r >= 220 && g >= 200 && b >= 180 && sat < 0.35 && (r + g + b) / 3 >= 210) return true;
    return false;
  };

  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    if (!isBg(p * channels)) return;
    visited[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length) {
    const p = queue.pop();
    const i = p * channels;
    out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const nbrs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      if (out[i + 3] === 0) continue;
      let nearT = false;
      for (const [dx, dy] of nbrs) {
        if (out[((y + dy) * width + (x + dx)) * 4 + 3] === 0) {
          nearT = true;
          break;
        }
      }
      if (!nearT) continue;

      const r0 = out[i], g0 = out[i + 1], b0 = out[i + 2];
      const isWashedOrange = r0 > 180 && g0 > 80 && b0 > 20 && b0 < 200 && r0 - b0 > 40;
      if (!isWashedOrange) continue;

      let t = 1 - b0 / 255;
      t = Math.min(0.98, Math.max(0.35, t));
      out[i] = Math.min(255, Math.max(0, Math.round((r0 - (1 - t) * 255) / t)));
      out[i + 1] = Math.min(255, Math.max(0, Math.round((g0 - (1 - t) * 255) / t)));
      out[i + 2] = Math.min(255, Math.max(0, Math.round((b0 - (1 - t) * 255) / t)));
      out[i + 3] = Math.round(Math.min(255, t * 255));
    }
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(file);
}

await clearWhiteBackground(logoPath);

const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB347"/>
      <stop offset="55%" stop-color="#FF8008"/>
      <stop offset="100%" stop-color="#FF5E00"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
</svg>`;

await sharp(logoPath).resize(1024, 1024, { fit: 'cover' }).png().toFile(path.join(assets, 'android-icon-foreground.png'));
await sharp(logoPath).resize(1024, 1024, { fit: 'cover' }).png().toFile(path.join(assets, 'icon.png'));
await sharp(logoPath).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(assets, 'splash-icon.png'));
await sharp(logoPath).resize(48, 48, { fit: 'cover' }).png().toFile(path.join(assets, 'favicon.png'));
await sharp(logoPath).png().toFile(path.join(assets, 'brand-logo.png'));
await sharp(Buffer.from(bgSvg)).png().toFile(path.join(assets, 'android-icon-background.png'));
await sharp(logoPath).resize(1024, 1024, { fit: 'cover' }).greyscale().threshold(200).png().toFile(path.join(assets, 'android-icon-monochrome.png'));

console.log('SnapNear icons written from snapnear-logo.png →', assets);
