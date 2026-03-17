const axios = require("axios")
const fs = require("fs")
const { cmd } = require("../command")

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers"
const OTP_API = "https://arslan-apis.vercel.app/more/liveotp"

const CHANNEL = "120363424268743982@newsletter"
const GROUP_LINK = "https://chat.whatsapp.com/KmtMAc6JOXEE2PvsHhX7SJ"

let running = false
let sent = new Set()

/* =========================
   HELPERS
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
   OTP START
========================= */

cmd({
    pattern: "otpstart",
    react: "🚀",
    desc: "Start OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    if(running) return reply("⚠️ *OTP System is already active!*")
    running = true
    reply("🚀 *OTP Forwarding System Enabled!*")

    while(running){
        try {
            const {data} = await axios.get(OTP_API)

            for(const v of data.result){
                const id = v.number + v.otp
                if(sent.has(id)) continue

                const message = `╔═══════════════════╗
  🔥 *ɴᴇᴡ ᴏᴛᴘ ʀᴇᴄᴇɪᴠᴇᴅ* 🔥
╚═══════════════════╝

┌────────────────────┈⊷
│ 🌍 *ᴄᴏᴜɴᴛʀʏ* : ${getCountry(v.number)}
│ 📱 *ɴᴜᴍʙᴇʀ* : ${hideNumber(v.number)}
│ 📲 *sᴇʀᴠɪᴄᴇ* : ${v.service.toUpperCase()}
│ 🔑 *ᴏᴛᴘ ᴄᴏᴅᴇ* : ${v.otp}
│ ⏰ *ᴛɪᴍᴇ* : ${v.time}
└────────────────────┈⊷

*KAMRAN MD AND ARSLAN MD*
*ᴊᴏɪɴ: ${GROUP_LINK}*`

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
    if(!code) return reply("💡 *Usage:* .numbers 92")

    try {
        const {data} = await axios.get(NUMBERS_API)
        const numbers = data.result.filter(v => v.startsWith(code))

        if(!numbers.length) return reply("❌ *No numbers found.*")

        const file = `numbers-${code}.txt`
        fs.writeFileSync(file, numbers.map(v=>"+"+v).join("\n"))

        const caption = `╭──────────────┈⊷
│ 📱 *ɴᴜᴍʙᴇʀs ᴅᴀᴛᴀʙᴀsᴇ*
├──────────────┈⊷
│ 🌐 *Code:* ${code}
│ 📊 *Total:* ${numbers.length}
╰──────────────┈⊷

*KAMRAN MD AND ARSLAN MD*
*ᴊᴏɪɴ: ${GROUP_LINK}*`

        await conn.sendMessage(
            m.chat,
            {
                document: fs.readFileSync(file),
                mimetype: "text/plain",
                fileName: `Numbers_${code}.txt`,
                caption: caption
            },
            {quoted: mek}
        )
        fs.unlinkSync(file)
    } catch(e) {
        reply("⚠️ *Server Error!*")
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
    reply("🛑 *OTP System Disabled!*")
})
