import sharp from "sharp";

const COVER_SIZE = 800;
/** Ниже этого L на чёрном фоне пятно не видно */
const MIN_LIGHTNESS = 0.35;

/**
 * Любой формат, который читает sharp → квадрат WebP 800×800 + dominant hex.
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
    throw createError({
      statusCode: 400,
      statusMessage: "cover must be an image",
    });
  }
}

/** Dominant из sharp.stats, чуть поднимаю яркость */
async function coverColorFromImage(buffer: Buffer) {
  const { dominant } = await sharp(buffer).stats();
  return rgbToHex(liftLightness(dominant.r, dominant.g, dominant.b));
}

function liftLightness(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  let l = (max + min) / 2;
  if (l >= MIN_LIGHTNESS || max === 0) return { r, g, b };
  const scale = MIN_LIGHTNESS / l;
  return {
    r: Math.min(255, Math.round(r * scale)),
    g: Math.min(255, Math.round(g * scale)),
    b: Math.min(255, Math.round(b * scale)),
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`;
}
