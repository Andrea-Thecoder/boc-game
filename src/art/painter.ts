/**
 * Minimal pixel-art painter on an offscreen canvas.
 * All coordinates are integers in sprite pixels; the game scales them up with nearest-neighbour.
 */
export class Painter {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  /** Horizontal offset applied to every draw call (used to paint animation frames side by side). */
  ox = 0;
  oy = 0;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D non disponibile');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  px(x: number, y: number, c: string): this {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x) + this.ox, Math.round(y) + this.oy, 1, 1);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: string): this {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x) + this.ox, Math.round(y) + this.oy, Math.round(w), Math.round(h));
    return this;
  }

  /** Filled ellipse, pixel-exact (no anti-aliasing). */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string, yMin = -Infinity, yMax = Infinity): this {
    for (let y = Math.max(Math.floor(cy - ry), yMin); y <= Math.min(Math.ceil(cy + ry), yMax); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
    }
    return this;
  }

  /** Makes a rect fully transparent. */
  clear(x: number, y: number, w: number, h: number): this {
    this.ctx.clearRect(Math.round(x) + this.ox, Math.round(y) + this.oy, w, h);
    return this;
  }

  /** Multiplies a translucent colour over the region (used for dusk tinting of backgrounds). */
  tint(color: string, alpha: number, x = 0, y = 0, w = this.width, h = this.height): this {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.globalCompositeOperation = 'source-atop';
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.restore();
    return this;
  }

  /** Bresenham line with given thickness (square brush). */
  line(x0: number, y0: number, x1: number, y1: number, c: string, t = 1): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0),
      dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1,
      sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.rect(x0 - Math.floor(t / 2), y0 - Math.floor(t / 2), t, t, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  /** Draws an ASCII map: each char is looked up in the palette, '.' and ' ' are transparent. */
  map(x: number, y: number, rows: string[], pal: Record<string, string>): this {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        const c = pal[ch];
        if (c) this.px(x + i, y + j, c);
      });
    });
    return this;
  }

  /** Ordered 2x2 dither between two colours inside a rect. ratio 0..1 = share of colour b. */
  dither(x: number, y: number, w: number, h: number, a: string, b: string, ratio: number): this {
    const bayer = [0, 2, 3, 1];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const th = (bayer[((j + y) % 2) * 2 + ((i + x) % 2)] + 0.5) / 4;
        this.px(x + i, y + j, ratio > th ? b : a);
      }
    }
    return this;
  }

  /**
   * Adds a 1px outline around every opaque pixel inside the region (default whole canvas).
   * Gives the classic chunky arcade sprite look.
   */
  outline(color = '#1a0f1f', x = 0, y = 0, w = this.width, h = this.height): this {
    const img = this.ctx.getImageData(x, y, w, h);
    const d = img.data;
    const solid = (i: number, j: number) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 0;
    const marks: [number, number][] = [];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (solid(i, j)) continue;
        if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) marks.push([i, j]);
      }
    }
    this.ctx.fillStyle = color;
    for (const [i, j] of marks) this.ctx.fillRect(x + i, y + j, 1, 1);
    return this;
  }
}

/** Utility: deterministic pseudo random generator so the generated art is the same every run. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
