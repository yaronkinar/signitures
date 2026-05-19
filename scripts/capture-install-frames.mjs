/**
 * Capture install tutorial frames from the running app.
 * Usage: npm run dev (separate terminal), then npm run capture:install-frames
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const framesDir = path.join(root, 'images', 'install-gif-frames')
const gifPath = path.join(root, 'images', 'install-outlook.gif')
const baseUrl = process.env.INSTALL_GIF_URL ?? 'http://localhost:5174/'

const steps = [
  {
    title: 'מלאו פרטים ולחצו "יצירת חתימה"',
    selector: '#generate'
  },
  {
    title: 'לחצו "התקנה ב-Outlook"',
    selector: '#installOutlook'
  },
  {
    title: 'הריצו את run-install-outlook-signature.bat מההורדות',
    selector: null,
    extraHtml:
      '<div style="margin:0 auto;max-width:520px;padding:14px 16px;border:2px dashed #93c5fd;border-radius:10px;background:#fff;font:600 15px Arial,sans-serif;color:#1e3a8a;text-align:center">run-install-outlook-signature.bat<br><span style="font-weight:400;font-size:13px;color:#64748b">install-outlook-signature.ps1</span></div>'
  },
  {
    title: 'הפעילו מחדש את Outlook - החתימה מוכנה',
    selector: null
  }
]

await mkdir(framesDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 960, height: 720 } })
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

for (let i = 0; i < steps.length; i += 1) {
  const { title, selector, extraHtml } = steps[i]
  await page.evaluate(
    ({ step, total, titleText, highlightSelector, extra }) => {
      const NS = 'install-gif'
      document.getElementById(`${NS}-overlay`)?.remove()
      document.getElementById(`${NS}-mock`)?.remove()
      document.querySelectorAll(`.${NS}-highlight`).forEach((el) => el.classList.remove(`${NS}-highlight`))
      if (!document.getElementById(`${NS}-style`)) {
        const style = document.createElement('style')
        style.id = `${NS}-style`
        style.textContent = `.${NS}-highlight{outline:4px solid #f59e0b!important;outline-offset:3px;box-shadow:0 0 0 6px rgba(245,158,11,.35)!important}`
        document.head.appendChild(style)
      }
      const overlay = document.createElement('div')
      overlay.id = `${NS}-overlay`
      overlay.setAttribute('dir', 'rtl')
      overlay.style.cssText =
        'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:12px;font:700 18px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);text-align:center;max-width:92%'
      const sub = document.createElement('div')
      sub.style.cssText = 'font-size:13px;opacity:.9;margin-bottom:4px'
      sub.textContent = `שלב ${step} מתוך ${total}`
      const main = document.createElement('div')
      main.textContent = titleText
      overlay.append(sub, main)
      document.body.append(overlay)
      if (extra) {
        const mock = document.createElement('div')
        mock.id = `${NS}-mock`
        mock.innerHTML = extra
        mock.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99998'
        document.body.append(mock)
      }
      if (highlightSelector) {
        const el = document.querySelector(highlightSelector)
        if (el) {
          el.classList.add(`${NS}-highlight`)
          el.scrollIntoView({ block: 'center' })
        }
      }
    },
    { step: i + 1, total: steps.length, titleText: title, highlightSelector: selector, extra: extraHtml ?? null }
  )
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(framesDir, `frame-${String(i + 1).padStart(2, '0')}.png`)
  })
}

await browser.close()

const inputPattern = path.join(framesDir, 'frame-%02d.png')
const gifArgs = [
  '-y',
  '-framerate',
  '0.35',
  '-i',
  inputPattern,
  '-vf',
  'fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer',
  '-loop',
  '0',
  gifPath
]
const result = spawnSync('ffmpeg', gifArgs, { cwd: root, stdio: 'inherit', shell: true })
if (result.status !== 0) {
  throw new Error('ffmpeg failed to build GIF')
}

console.log(`GIF saved to ${gifPath}`)
