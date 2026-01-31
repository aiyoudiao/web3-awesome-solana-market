import * as THREE from 'three';

type RuneTextureOptions = {
  size?: number;
  seed?: number;
  tile?: number;
  stroke?: string;
  glow?: string;
  background?: string;
};

const mulberry32 = (a: number) => {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const createRuneTexture = (opts: RuneTextureOptions = {}) => {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const size = opts.size ?? 512;
  const seed = opts.seed ?? 1337;
  const tile = opts.tile ?? 4;
  const stroke = opts.stroke ?? 'rgba(167, 139, 250, 0.85)';
  const glow = opts.glow ?? 'rgba(20, 241, 149, 0.22)';
  const background = opts.background ?? 'rgba(0,0,0,0)';

  const rand = mulberry32(seed);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  const cell = size / tile;
  const pad = cell * 0.12;

  const drawGlyph = (x0: number, y0: number, w: number, h: number) => {
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    const arms = 2 + Math.floor(rand() * 4);
    const steps = 3 + Math.floor(rand() * 4);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let i = 0; i < steps; i++) {
      const a = rand() * Math.PI * 2;
      const r = (0.18 + rand() * 0.32) * Math.min(w, h);
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      ctx.lineTo(px, py);
      if (rand() > 0.65) ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 + rand() * 0.4;
      const r1 = 0.12 * Math.min(w, h);
      const r2 = (0.35 + rand() * 0.25) * Math.min(w, h);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      if (rand() > 0.5) {
        const b = a + (rand() > 0.5 ? 1 : -1) * (0.7 + rand() * 0.7);
        ctx.lineTo(cx + Math.cos(b) * (r2 * 0.7), cy + Math.sin(b) * (r2 * 0.7));
      }
      ctx.stroke();
    }

    if (rand() > 0.6) {
      const ringR = (0.18 + rand() * 0.22) * Math.min(w, h);
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, Math.floor(size / 256));
  ctx.strokeStyle = glow;
  for (let y = 0; y < tile; y++) {
    for (let x = 0; x < tile; x++) {
      const x0 = x * cell + pad;
      const y0 = y * cell + pad;
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      ctx.globalAlpha = 0.8;
      drawGlyph(x0, y0, w, h);
    }
  }

  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.5, size / 340);
  for (let y = 0; y < tile; y++) {
    for (let x = 0; x < tile; x++) {
      const x0 = x * cell + pad;
      const y0 = y * cell + pad;
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      ctx.globalAlpha = 1;
      drawGlyph(x0, y0, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace as any;
  texture.needsUpdate = true;
  return texture;
};
