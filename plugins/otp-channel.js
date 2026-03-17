const axios = require("axios")
const fs = require("fs")
const { cmd } = require("../command")

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers"
const OTP_API = "https://arslan-apis.vercel.app/more/liveotp"

const CHANNEL = "120363424268743982@newsletter"

let running = false
let sent = new Set()

/* =========================
   COUNTRY FLAG & STYLE
========================= */

function getCountry(num){
    if(num.startsWith("92")) return "🇵🇰 ᴘᴀᴋɪsᴛᴀɴ"
    if(num.startsWith("91")) return "🇮🇳 ɪɴᴅɪᴀ"
    if(num.startsWith("1")) return "🇺🇸 ᴜsᴀ"
    if(num.startsWith("44")) return "🇬🇧 ᴜᴋ"
    return "🌍 ᴜɴᴋɴᴏᴡɴ"
}

function hideNumber(num){
    const last4 = num.slice(-4)
    return "+" + num.slice(0,2) + " xxxx-xx" + last4
}

/* =========================
   NUMBERS COMMAND
========================= */

cmd({
    pattern: "numbers2",
    react: "📱",
    desc: "Get numbers by country code",
    category: "tools",
    use: ".numbers 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    const code = args[0]
    if(!code) return reply("💡 *Example:* .numbers 92")

    try {
        const {data} = await axios.get(NUMBERS_API)
        const numbers = data.result.filter(v => v.startsWith(code))

        if(!numbers.length) return reply("❌ *Country not available in database!*")

        const file = `numbers-${code}.txt`
        fs.writeFileSync(file, numbers.map(v=>"+"+v).join("\n"))

        await conn.sendMessage(
            m.chat,
            {
                document: fs.readFileSync(file),
                mimetype: "text/plain",
                fileName: `Numbers_${code}.txt`,
                caption: `╭──────────────┈⊷\n│ 📱 *ɴᴜᴍʙᴇʀs ʟɪsᴛ*\n├──────────────┈⊷\n│ 🌐 *Code:* ${code}\n│ 📊 *Total:* ${numbers.length}\n╰──────────────┈⊷\n\n*KAMRAN MD AND ARSLAN MD*`
            },
            {quoted: mek}
        )
        fs.unlinkSync(file)
    } catch(e) {
        reply("⚠️ *Error fetching numbers!*")
    }
})

/* =========================
   OTP START (STYLISH)
========================= */

cmd({
    pattern: "otpstart",
    react: "🚀",
    desc: "Start OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    if(running) return reply("⚡ *OTP System is already running!*")
    running = true
    reply("✅ *OTP Forwarding Started Successfully!*")

    while(running){
        try {
            const {data} = await axios.get(OTP_API)

            for(const v of data.result){
                const id = v.number + v.otp
                if(sent.has(id)) continue

                const message = `╔═══════════════════╗
  🚀 *ɴᴇᴡ ᴏᴛᴘ ᴅᴇᴛᴇᴄᴛᴇᴅ* 🚀
╚═══════════════════╝

┌────────────────────┈⊷
│ 🌍 *ᴄᴏᴜɴᴛʀʏ* : ${getCountry(v.number)}
│ 📱 *ɴᴜᴍʙᴇʀ* : ${hideNumber(v.number)}
│ 📲 *sᴇʀᴠɪᴄᴇ* : ${v.service.toUpperCase()}
│ 🔑 *ᴏᴛᴘ ᴄᴏᴅᴇ* : ${v.otp}
│ ⏰ *ᴛɪᴍᴇ* : ${v.time}
└────────────────────┈⊷

   *KAMRAN MD AND ARSLAN MD*`

                await conn.sendMessage(CHANNEL, { text: message })
                sent.add(id)
            }
        } catch(e) {
            console.log("Error: ", e.message)
        }
        await new Promise(r => setTimeout(r, 10000))
    }
})

/* =========================
   OTP STOP
========================= */

cmd({
    pattern: "otpstop",
    react: "🛑",
    desc: "Stop OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    running = false
    reply("🛑 *OTP Forwarding Stopped!*")
})

