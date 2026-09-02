import sharp from "sharp";
import { ApiErrorCode, throwApiError } from "./apiError";

const COVER_SIZE = 800;
const AVATAR_SIZE = 512;

/** Размер сэмпла для accent-цвета (не влияет на WebP в бакете) */
const COLOR_SAMPLE_SIZE = 48;
const HUE_BIN_COUNT = 24;

/** Отсекаем чёрный текст, белые рамки и почти серый шум */
const MIN_SATURATION = 0.14;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.88;

/** Итог под тёмный hero: читаемый, без кислотного неона */
const TARGET_LIGHTNESS = 0.38;
const TARGET_SATURATION_MIN = 0.32;
const TARGET_SATURATION_MAX = 0.68;
const MUTED_SATURATION = 0.22;

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

/**
 * Любой формат, который читает sharp → квадрат WebP 800×800 + accent hex для hero.
 * EXIF-поворот учитываю. Не картинка → 400.
 */
export async function processAlbumCover(input: Buffer) {
  try {
    const body = await sharp(input)
      .rotate()
      .resize(COVER_SIZE, COVER_SIZE, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    const coverColor = await coverColorFromImage(body);
    return { body, coverColor };
  } catch (error) {
    if (typeof error === "object" && error && "statusCode" in error) throw error;
    throwApiError(400, ApiErrorCode.COVER_MUST_BE_IMAGE);
  }
}

/**
 * Аватар: квадрат JPEG 512×512 (cover), EXIF-поворот.
 * Ключ в бакете — avatars/{userId}.jpg.
 */
export async function processUserAvatar(input: Buffer) {
  try {
    return await sharp(input)
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throwApiError(400, ApiErrorCode.AVATAR_MUST_BE_IMAGE);
  }
}

/** Accent из сэмпла пикселей; fallback — sharp.stats().dominant */
async function coverColorFromImage(buffer: Buffer) {
  const pixels = await samplePixels(buffer);

  const accent = pickAccentColor(pixels, MIN_SATURATION);
  if (accent) return rgbToHex(normalizeForHero(accent));

  const relaxed = pickAccentColor(pixels, 0.06);
  if (relaxed) return rgbToHex(normalizeForHero(relaxed));

  const { dominant } = await sharp(buffer).stats();
  return rgbToHex(
    normalizeForHero({ r: dominant.r, g: dominant.g, b: dominant.b }),
  );
}

/** Уменьшенная обложка → список RGB-пикселей */
async function samplePixels(buffer: Buffer): Promise<Rgb[]> {
  const { data, info } = await sharp(buffer)
    .resize(COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixels: Rgb[] = [];

  for (let i = 0; i < data.length; i += channels) {
    pixels.push({
      r: data[i] ?? 0,
      g: data[i + 1] ?? 0,
      b: data[i + 2] ?? 0,
    });
  }

  return pixels;
}

/**
 * Самый «выразительный» hue-bin: насыщенные пиксели средней яркости,
 * а не самый частый серый/чёрный из гистограммы sharp.
 */
function pickAccentColor(pixels: Rgb[], minSaturation: number): Rgb | null {
  const bins = Array.from({ length: HUE_BIN_COUNT }, () => ({
    weight: 0,
    r: 0,
    g: 0,
    b: 0,
  }));

  for (const rgb of pixels) {
    const hsl = rgbToHsl(rgb);
    const weight = pixelWeight(hsl, minSaturation);
    if (weight <= 0) continue;

    const bin = Math.min(
      HUE_BIN_COUNT - 1,
      Math.floor(hsl.h * HUE_BIN_COUNT),
    );
    const bucket = bins[bin];
    if (!bucket) continue;

    bucket.weight += weight;
    bucket.r += rgb.r * weight;
    bucket.g += rgb.g * weight;
    bucket.b += rgb.b * weight;
  }

  const best = bins.reduce((winner, bin) =>
    bin.weight > winner.weight ? bin : winner,
  );

  if (best.weight <= 0) return null;

  return {
    r: Math.round(best.r / best.weight),
    g: Math.round(best.g / best.weight),
    b: Math.round(best.b / best.weight),
  };
}

/** Вес пикселя: яркие акценты важнее теней и серого фона */
function pixelWeight(hsl: Hsl, minSaturation: number) {
  if (hsl.l < MIN_LIGHTNESS || hsl.l > MAX_LIGHTNESS) return 0;
  if (hsl.s < minSaturation) return 0;

  const midToneBias = 1 - Math.min(1, Math.abs(hsl.l - 0.45) / 0.45);
  return hsl.s * hsl.s * midToneBias;
}

/** Приводим accent к диапазону, удобному для заливки hero на primary-black */
function normalizeForHero(rgb: Rgb): Rgb {
  const hsl = rgbToHsl(rgb);

  if (hsl.s < 0.08) {
    return hslToRgb({
      h: hsl.h,
      s: MUTED_SATURATION,
      l: TARGET_LIGHTNESS,
    });
  }

  const saturation = Math.min(
    TARGET_SATURATION_MAX,
    Math.max(TARGET_SATURATION_MIN, hsl.s),
  );

  return hslToRgb({
    h: hsl.h,
    s: saturation,
    l: TARGET_LIGHTNESS,
  });
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r1) {
    h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6;
  } else if (max === g1) {
    h = ((b1 - r1) / d + 2) / 6;
  } else {
    h = ((r1 - g1) / d + 4) / 6;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function rgbToHex(rgb: Rgb) {
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`;
}
