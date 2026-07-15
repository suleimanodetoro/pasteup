// Generates the first-run "how to" clipping as a real image (offscreen canvas),
// so it behaves like any other clipping on the page.

const W = 460
const H = 560

export function makeHowToCardDataURL(): string {
  const canvas = document.createElement('canvas')
  const dpr = 2
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Paper
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#fbf3e2')
  grad.addColorStop(1, '#f4e7cd')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Torn-ish top edge accent
  ctx.strokeStyle = 'rgba(198, 106, 74, 0.9)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(28, 26)
  ctx.lineTo(W - 28, 26)
  ctx.stroke()

  // Header
  ctx.fillStyle = '#3a3026'
  ctx.textBaseline = 'top'
  ctx.font = '700 34px Georgia, "Times New Roman", serif'
  ctx.fillText('welcome to', 34, 52)
  ctx.font = '800 52px Georgia, "Times New Roman", serif'
  ctx.fillStyle = '#c66a4a'
  ctx.fillText('Pasteup ✂', 34, 92)

  ctx.fillStyle = '#5a4c3b'
  ctx.font = 'italic 20px Georgia, serif'
  ctx.fillText('your cozy digital cutting mat', 36, 156)

  const steps = [
    ['01', 'upload or search an image'],
    ['02', 'snip a clipping with the scissors'],
    ['03', 'build up your collage'],
    ['04', 'export or submit to the gallery'],
  ]
  let y = 214
  for (const [num, text] of steps) {
    ctx.fillStyle = '#c66a4a'
    ctx.font = '800 30px Georgia, serif'
    ctx.fillText(num, 36, y)
    ctx.fillStyle = '#3a3026'
    ctx.font = '400 21px Georgia, serif'
    ctx.fillText(text, 88, y + 4)
    y += 62
  }

  // Footer nudge
  ctx.fillStyle = '#8a7a63'
  ctx.font = 'italic 19px Georgia, serif'
  ctx.fillText('click me… then trash me →', 36, H - 58)

  return canvas.toDataURL('image/png')
}

export const HOW_TO_SIZE = { width: W, height: H }
