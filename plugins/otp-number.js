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
   HELPERS (STYLISH)
========================= */

function getCountry(num){
    if(num.startsWith("92")) return "🇵🇰 Germany" // Note: API data ke mutabiq flag aur name match karein
    if(num.startsWith("49")) return "🇩🇪 Germany"
    if(num.startsWith("91")) return "🇮🇳 India"
    if(num.startsWith("1")) return "🇺🇸 USA"
    return "🌍 Unknown"
}

function hideNumber(num){
    const first3 = num.slice(0,3)
    const last4 = num.slice(-4)
    return first3 + "•••" + last4
}

/* =========================
   OTP START (STYLISH)
========================= */

cmd({
    pattern: "otpstart2",
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

                // Screenshot Jaisa Stylish Design
                const message = `✨ ${getCountry(v.number).split(' ')[0]} | *${v.service.toUpperCase()} Message* ⚡

┃ *Time:* ${v.time}
┃ *Country:* ${getCountry(v.number)}
*Number: ${hideNumber(v.number)}*
┃ *Service:* ${v.service.toUpperCase()}
*OTP: ${v.otp}*

┃ *Join For Numbers:*
¹ ${GROUP_LINK}

*Full Message:*
${v.full_msg || "# Your " + v.service + " code is " + v.otp + ". Do not share this code."}

┃ © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`

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
    pattern: "otpstop2",
    react: "🛑",
    desc: "Stop OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    running = false
    reply("🛑 *OTP System Disabled!*")
})
