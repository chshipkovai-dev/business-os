import sharp from "sharp"
import { readFileSync, createReadStream } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import FormData from "form-data"
import https from "https"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read env
const envPath = join(__dirname, "../.env.local")
const env = readFileSync(envPath, "utf8")
const getEnv = (key) => {
  const match = env.match(new RegExp(`^${key}=(.+)$`, "m"))
  return match?.[1]?.trim()
}

const BOT_TOKEN = getEnv("TELEGRAM_BOT_TOKEN")
const CHAT_ID = getEnv("TELEGRAM_CHAT_ID")

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не найдены в .env.local")
  process.exit(1)
}

// Convert SVG → PNG
const svgPath = join(__dirname, "avatar.svg")
const pngPath = join(__dirname, "avatar.png")

console.log("🎨 Конвертирую SVG → PNG...")
await sharp(svgPath)
  .resize(512, 512)
  .png({ quality: 100 })
  .toFile(pngPath)

console.log("✅ PNG создан: avatar.png")

// Send photo to Telegram
const sendPhoto = () => new Promise((resolve, reject) => {
  const form = new FormData()
  form.append("chat_id", CHAT_ID)
  form.append("photo", createReadStream(pngPath))
  form.append("caption", "🚀 *Business OS — AI Pipeline*\n\nАватарка для твоего Telegram бота!\n\nСохрани и установи через @BotFather: /setuserpic", { contentType: "text/plain" })
  form.append("parse_mode", "Markdown")

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendPhoto`,
    method: "POST",
    headers: form.getHeaders(),
  }

  const req = https.request(options, (res) => {
    let data = ""
    res.on("data", chunk => data += chunk)
    res.on("end", () => {
      const parsed = JSON.parse(data)
      if (parsed.ok) resolve(parsed)
      else reject(new Error(`Telegram API error: ${parsed.description}`))
    })
  })

  req.on("error", reject)
  form.pipe(req)
})

// Also try setMyPhoto (set bot avatar directly)
const setMyPhoto = () => new Promise((resolve, reject) => {
  const form = new FormData()
  form.append("photo", createReadStream(pngPath))

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/setMyPhoto`,
    method: "POST",
    headers: form.getHeaders(),
  }

  const req = https.request(options, (res) => {
    let data = ""
    res.on("data", chunk => data += chunk)
    res.on("end", () => {
      const parsed = JSON.parse(data)
      resolve(parsed)
    })
  })

  req.on("error", reject)
  form.pipe(req)
})

console.log("📤 Отправляю в Telegram...")

try {
  const result = await sendPhoto()
  console.log("✅ Фото отправлено в чат!")

  console.log("🤖 Устанавливаю как аватар бота...")
  const botResult = await setMyPhoto()
  if (botResult.ok) {
    console.log("✅ Аватар бота установлен!")
  } else {
    console.log("ℹ️  setMyPhoto:", botResult.description || "не поддерживается (установи вручную через @BotFather)")
  }
} catch (err) {
  console.error("❌ Ошибка:", err.message)
}
