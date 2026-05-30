type PlaceholderSize = 'cover' | 'square';

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

export function buildLocalPlaceholderSvg(seed: string, size: PlaceholderSize = 'cover'): Buffer {
  const hue = hashSeed(seed || 'default') % 360;
  const [w, h] = size === 'square' ? [400, 400] : [800, 400];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue},55%,88%)"/>
        <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},45%,75%)"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  return Buffer.from(svg, 'utf-8');
}
