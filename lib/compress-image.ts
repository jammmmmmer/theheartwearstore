/**
 * Client-side image preparation for uploads.
 *
 * Why this exists: Netlify rejects request bodies over ~6MB at the platform
 * layer — the function never runs and the client receives a plain-text
 * "Internal Error. ID: …" instead of JSON. So the encoded file must stay
 * comfortably under that ceiling, including multipart overhead.
 *
 * The old approach resized large images but re-encoded them as PNG. For
 * photographic sources (phone photos, JPEGs) PNG re-encoding typically
 * *inflates* the file 2–3x, pushing a 4MB JPEG past the 6MB limit and
 * producing the cryptic "not valid JSON" failure on /create.
 *
 * Strategy here:
 * - Files already small enough pass through untouched (original quality).
 * - JPEG/WebP sources are resized and re-encoded as JPEG — no alpha to lose.
 * - PNG sources keep PNG only if they actually use transparency; opaque
 *   PNGs (photos saved as PNG) become JPEG.
 * - Dimensions/quality step down until the result fits the budget.
 * - Returns null if the image cannot be brought under budget, so callers
 *   can show a human-readable error instead of a failed request.
 */

const PASS_THROUGH_BYTES = 3 * 1024 * 1024 // send as-is below this
const TARGET_BYTES = 4.5 * 1024 * 1024 // budget: 6MB platform limit minus headroom

function loadImage(f: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Samples the alpha channel to detect real transparency (cheap: reads a downscaled copy). */
function hasTransparency(img: HTMLImageElement): boolean {
  const sample = document.createElement('canvas')
  const s = Math.min(1, 256 / Math.max(img.width, img.height))
  sample.width = Math.max(1, Math.round(img.width * s))
  sample.height = Math.max(1, Math.round(img.height * s))
  const ctx = sample.getContext('2d')
  if (!ctx) return true // can't tell — assume transparency to be safe
  ctx.drawImage(img, 0, 0, sample.width, sample.height)
  const data = ctx.getImageData(0, 0, sample.width, sample.height).data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true
  }
  return false
}

/**
 * Returns a File guaranteed to fit the upload budget, or null if the image
 * couldn't be reduced enough (caller should surface a friendly error).
 */
export async function prepareImageForUpload(f: File): Promise<File | null> {
  if (f.size < PASS_THROUGH_BYTES) return f

  const img = await loadImage(f)
  if (!img) return f.size <= TARGET_BYTES ? f : null

  // Keep PNG only when transparency is actually used — alpha matters for
  // print placement. Everything else (photos) compresses far better as JPEG.
  const needsAlpha = f.type === 'image/png' && hasTransparency(img)

  const maxDims = [2000, 1600, 1200]
  const jpegQualities = [0.9, 0.8]

  for (const max of maxDims) {
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    if (needsAlpha) {
      const blob = await encode(canvas, 'image/png')
      if (blob && blob.size <= TARGET_BYTES) {
        return new File([blob], f.name.replace(/\.\w+$/, '') + '.png', { type: 'image/png' })
      }
    } else {
      for (const q of jpegQualities) {
        const blob = await encode(canvas, 'image/jpeg', q)
        if (blob && blob.size <= TARGET_BYTES) {
          return new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
        }
      }
    }
  }

  return null
}
