const axios = require("axios")
const fs = require("fs")
const { cmd } = require("../command")

// Teeno APIs ki list
const API_SOURCES = [
    "https://arslan-api-site.vercel.app/more/activenumbers01",
    "https://arslan-api-site.vercel.app/more/activenumbers02",
    "https://arslan-api-site.vercel.app/more/activenumbers03"
]

const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb7QIUD5kg7FngcRYY1N"

/* =========================
   NUMBERS COMMAND (3 APIs)
========================= */

cmd({
    pattern: "numbers2",
    alias: ["getnum", "activenum"],
    react: "📱",
    desc: "Get numbers from 3 APIs by country code",
    category: "tools",
    use: ".numbers2 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    const code = args[0]
    if(!code) return reply("💡 *Usage:* .numbers2 92")

    try {
        reply(`⏳ *Fetching active numbers from 3 sources for code ${code}...*`)

        // Teeno APIs se ek saath data mangwana
        const results = await Promise.allSettled(
            API_SOURCES.map(url => axios.get(url, { timeout: 15000 }))
        )

        let allNumbers = []
        let activeSources = 0

        results.forEach((res, index) => {
            if (res.status === 'fulfilled' && res.value.data && Array.isArray(res.value.data.result)) {
                allNumbers = allNumbers.concat(res.value.data.result)
                activeSources++
            } else {
                console.log(`⚠️ Source ${index + 1} failed or timeout.`)
            }
        })

        // Duplicates khatam karna aur filter karna
        const uniqueNumbers = [...new Set(allNumbers)]
        const filteredNumbers = uniqueNumbers.filter(v => v.startsWith(code))

        if(!filteredNumbers.length) {
            return reply(`❌ *No numbers found for code ${code}.*\n📡 Sources Active: ${activeSources}/3`)
        }

        const file = `Numbers_${code}.txt`
        fs.writeFileSync(file, filteredNumbers.map(v => "+" + v).join("\n"))

        const caption = `╭──────────────┈⊷
│ 📱 *ɴᴜᴍʙᴇʀs ᴅᴀᴛᴀʙᴀsᴇ*
├──────────────┈⊷
│ 🌐 *Code:* ${code}
│ 📊 *Total Unique:* ${filteredNumbers.length}
│ 📡 *Sources:* ${activeSources}/3 Active
╰──────────────┈⊷
*ᴊᴏɪɴ: ${CHANNEL_LINK}*

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ*`

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
        
        // File delete karna storage se
        if (fs.existsSync(file)) fs.unlinkSync(file)

    } catch(e) {
        console.error(e)
        reply("⚠️ *Server Error! Please try again later.*")
    }
})

