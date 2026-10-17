import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB347"/>
      <stop offset="55%" stop-color="#FF8008"/>
      <stop offset="100%" stop-color="#FF5E00"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <text x="512" y="512" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="400" font-weight="900" fill="#FFFFFF" letter-spacing="-8">SN</text>
</svg>`;

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

const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#000000"/>
  <text x="512" y="512" text-anchor="middle" dominant-baseline="central" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="400" font-weight="900" fill="#FFFFFF" letter-spacing="-8">SN</text>
</svg>`;

const fg = await sharp(Buffer.from(svg)).png().toBuffer();
await sharp(fg).toFile(path.join(assets, 'android-icon-foreground.png'));
await sharp(fg).toFile(path.join(assets, 'icon.png'));
await sharp(Buffer.from(bgSvg)).png().toFile(path.join(assets, 'android-icon-background.png'));
await sharp(Buffer.from(monoSvg)).png().toFile(path.join(assets, 'android-icon-monochrome.png'));
console.log('SN icons written to', assets);
