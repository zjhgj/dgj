const axios = require("axios")
const fs = require("fs")
const { cmd } = require("../command")

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers02"
const OTP_API = "https://drkamran-api-site.vercel.app/api/search/fake01"

// Updated variables
const CHANNEL_ID = "120363424268743982@newsletter"
const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb7QIUD5kg7FngcRYY1N"

let running = false
let sent = new Set()

/* =========================
   HELPERS
========================= */

function getCountry(num){
    if(num.startsWith("92")) return "🇵🇰 Pakistan"
    if(num.startsWith("49")) return "🇩🇪 Germany"
    if(num.startsWith("91")) return "🇮🇳 India"
    if(num.startsWith("1")) return "🇺🇸 USA"
    if(num.startsWith("44")) return "🇬🇧 UK"
    if(num.startsWith("93")) return "🇦🇫 Afghanistan"
    if(num.startsWith("355")) return "🇦🇱 Albania"
    if(num.startsWith("213")) return "🇩🇿 Algeria"
    if(num.startsWith("376")) return "🇦🇩 Andorra"
    if(num.startsWith("244")) return "🇦🇴 Angola"
    if(num.startsWith("54")) return "🇦🇷 Argentina"
    if(num.startsWith("374")) return "🇦🇲 Armenia"
    if(num.startsWith("61")) return "🇦🇺 Australia"
    if(num.startsWith("43")) return "🇦🇹 Austria"
    if(num.startsWith("994")) return "🇦🇿 Azerbaijan"
    if(num.startsWith("973")) return "🇧🇭 Bahrain"
    if(num.startsWith("880")) return "🇧🇩 Bangladesh"
    if(num.startsWith("375")) return "🇧🇾 Belarus"
    if(num.startsWith("32")) return "🇧🇪 Belgium"
    if(num.startsWith("501")) return "🇧🇿 Belize"
    if(num.startsWith("229")) return "🇧🇯 Benin"
    if(num.startsWith("975")) return "🇧🇹 Bhutan"
    if(num.startsWith("591")) return "🇧🇴 Bolivia"
    if(num.startsWith("387")) return "🇧🇦 Bosnia"
    if(num.startsWith("267")) return "🇧🇼 Botswana"
    if(num.startsWith("55")) return "🇧🇷 Brazil"
    if(num.startsWith("673")) return "🇧🇳 Brunei"
    if(num.startsWith("359")) return "🇧🇬 Bulgaria"
    if(num.startsWith("226")) return "🇧🇫 Burkina Faso"
    if(num.startsWith("257")) return "🇧🇮 Burundi"
    if(num.startsWith("855")) return "🇰🇭 Cambodia"
    if(num.startsWith("237")) return "🇨🇲 Cameroon"
    if(num.startsWith("56")) return "🇨🇱 Chile"
    if(num.startsWith("86")) return "🇨🇳 China"
    if(num.startsWith("57")) return "🇨🇴 Colombia"
    if(num.startsWith("269")) return "🇰🇲 Comoros"
    if(num.startsWith("242")) return "🇨🇬 Congo"
    if(num.startsWith("506")) return "🇨🇷 Costa Rica"
    if(num.startsWith("385")) return "🇭🇷 Croatia"
    if(num.startsWith("53")) return "🇨🇺 Cuba"
    if(num.startsWith("357")) return "🇨🇾 Cyprus"
    if(num.startsWith("420")) return "🇨🇿 Czech Republic"
    if(num.startsWith("45")) return "🇩🇰 Denmark"
    if(num.startsWith("253")) return "🇩🇯 Djibouti"
    if(num.startsWith("20")) return "🇪🇬 Egypt"
    if(num.startsWith("503")) return "🇸🇻 El Salvador"
    if(num.startsWith("372")) return "🇪🇪 Estonia"
    if(num.startsWith("251")) return "🇪🇹 Ethiopia"
    if(num.startsWith("358")) return "🇫🇮 Finland"
    if(num.startsWith("33")) return "🇫🇷 France"
    if(num.startsWith("995")) return "🇬🇪 Georgia"
    if(num.startsWith("30")) return "🇬🇷 Greece"
    if(num.startsWith("852")) return "🇭🇰 Hong Kong"
    if(num.startsWith("36")) return "🇭🇺 Hungary"
    if(num.startsWith("354")) return "🇮🇸 Iceland"
    if(num.startsWith("62")) return "🇮🇩 Indonesia"
    if(num.startsWith("98")) return "🇮🇷 Iran"
    if(num.startsWith("964")) return "🇮🇶 Iraq"
    if(num.startsWith("353")) return "🇮🇪 Ireland"
    if(num.startsWith("972")) return "🇮🇱 Israel"
    if(num.startsWith("39")) return "🇮🇹 Italy"
    if(num.startsWith("81")) return "🇯🇵 Japan"
    if(num.startsWith("962")) return "🇯🇴 Jordan"
    if(num.startsWith("7")) return "🇰🇿 Kazakhstan"
    if(num.startsWith("254")) return "🇰🇪 Kenya"
    if(num.startsWith("965")) return "🇰🇼 Kuwait"
    if(num.startsWith("996")) return "🇰🇬 Kyrgyzstan"
    if(num.startsWith("856")) return "🇱🇦 Laos"
    if(num.startsWith("371")) return "🇱🇻 Latvia"
    if(num.startsWith("961")) return "🇱🇧 Lebanon"
    if(num.startsWith("266")) return "🇱🇸 Lesotho"
    if(num.startsWith("231")) return "🇱🇷 Liberia"
    if(num.startsWith("218")) return "🇱🇾 Libya"
    if(num.startsWith("423")) return "🇱🇮 Liechtenstein"
    if(num.startsWith("370")) return "🇱🇹 Lithuania"
    if(num.startsWith("352")) return "🇱🇺 Luxembourg"
    if(num.startsWith("853")) return "🇲🇴 Macau"
    if(num.startsWith("389")) return "🇲🇰 Macedonia"
    if(num.startsWith("261")) return "🇲🇬 Madagascar"
    if(num.startsWith("265")) return "🇲🇼 Malawi"
    if(num.startsWith("60")) return "🇲🇾 Malaysia"
    if(num.startsWith("960")) return "🇲🇻 Maldives"
    if(num.startsWith("223")) return "🇲🇱 Mali"
    if(num.startsWith("356")) return "🇲🇹 Malta"
    if(num.startsWith("222")) return "🇲🇷 Mauritania"
    if(num.startsWith("230")) return "🇲🇺 Mauritius"
    if(num.startsWith("52")) return "🇲🇽 Mexico"
    if(num.startsWith("373")) return "🇲🇩 Moldova"
    if(num.startsWith("377")) return "🇲🇨 Monaco"
    if(num.startsWith("976")) return "🇲🇳 Mongolia"
    if(num.startsWith("212")) return "🇲🇦 Morocco"
    if(num.startsWith("258")) return "🇲🇿 Mozambique"
    if(num.startsWith("95")) return "🇲🇲 Myanmar"
    if(num.startsWith("264")) return "🇳🇦 Namibia"
    if(num.startsWith("977")) return "🇳🇵 Nepal"
    if(num.startsWith("31")) return "🇳🇱 Netherlands"
    if(num.startsWith("64")) return "🇳🇿 New Zealand"
    if(num.startsWith("505")) return "🇳🇮 Nicaragua"
    if(num.startsWith("227")) return "🇳🇪 Niger"
    if(num.startsWith("234")) return "🇳🇬 Nigeria"
    if(num.startsWith("47")) return "🇳🇴 Norway"
    if(num.startsWith("968")) return "🇴🇲 Oman"
    if(num.startsWith("63")) return "🇵🇭 Philippines"
    if(num.startsWith("48")) return "🇵🇱 Poland"
    if(num.startsWith("351")) return "🇵🇹 Portugal"
    if(num.startsWith("974")) return "🇶🇦 Qatar"
    if(num.startsWith("40")) return "🇷🇴 Romania"
    if(num.startsWith("7")) return "🇷🇺 Russia"
    if(num.startsWith("250")) return "🇷🇼 Rwanda"
    if(num.startsWith("966")) return "🇸🇦 Saudi Arabia"
    if(num.startsWith("221")) return "🇸🇳 Senegal"
    if(num.startsWith("381")) return "🇷🇸 Serbia"
    if(num.startsWith("65")) return "🇸🇬 Singapore"
    if(num.startsWith("421")) return "🇸🇰 Slovakia"
    if(num.startsWith("386")) return "🇸🇮 Slovenia"
    if(num.startsWith("252")) return "🇸🇴 Somalia"
    if(num.startsWith("27")) return "🇿🇦 South Africa"
    if(num.startsWith("82")) return "🇰🇷 South Korea"
    if(num.startsWith("34")) return "🇪🇸 Spain"
    if(num.startsWith("94")) return "🇱🇰 Sri Lanka"
    if(num.startsWith("249")) return "🇸🇩 Sudan"
    if(num.startsWith("46")) return "🇸🇪 Sweden"
    if(num.startsWith("41")) return "🇨🇭 Switzerland"
    if(num.startsWith("963")) return "🇸🇾 Syria"
    if(num.startsWith("886")) return "🇹🇼 Taiwan"
    if(num.startsWith("66")) return "🇹🇭 Thailand"
    if(num.startsWith("228")) return "🇹🇬 Togo"
    if(num.startsWith("216")) return "🇹🇳 Tunisia"
    if(num.startsWith("90")) return "🇹🇷 Turkey"
    if(num.startsWith("993")) return "🇹🇲 Turkmenistan"
    if(num.startsWith("256")) return "🇺🇬 Uganda"
    if(num.startsWith("380")) return "🇺🇦 Ukraine"
    if(num.startsWith("971")) return "🇦🇪 UAE"
    if(num.startsWith("598")) return "🇺🇾 Uruguay"
    if(num.startsWith("998")) return "🇺🇿 Uzbekistan"
    if(num.startsWith("58")) return "🇻🇪 Venezuela"
    if(num.startsWith("84")) return "🇻🇳 Vietnam"
    if(num.startsWith("967")) return "🇾🇪 Yemen"
    if(num.startsWith("260")) return "🇿🇲 Zambia"
    if(num.startsWith("263")) return "🇿🇼 Zimbabwe"
    return "🌍 Unknown"
}

function hideNumber(num){
    const last4 = num.slice(-4)
    return "+" + num.slice(0,2) + " xxxx-xx" + last4
}

/* =========================
   OTP START
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

                const message = `┏━♡━━━━━━━🪀━━━━━━━♡━┓
  🔥 *sᴇʀᴠɪᴄᴇ ² ᴏᴛᴘ ʀᴇᴄᴇɪᴠᴇᴅ* 🔥
┗━♡━━━━━━━🪀━━━━━━━♡━┛

┌────────────────────┈⊷
│ 🌍 *ᴄᴏᴜɴᴛʀʏ* : ${getCountry(v.number)}
│ 📱 *ɴᴜᴍʙᴇʀ* : ${hideNumber(v.number)}
│ 📲 *sᴇʀᴠɪᴄᴇ* : ${v.service.toUpperCase()}
│ 🔑 *ᴏᴛᴘ ᴄᴏᴅᴇ* : ${v.otp}
└────────────────────┈⊷
* *ᴊᴏɪɴ*
> ¹ https://chat.whatsapp.com/KRyARlvcUjoIv1CPSSyQA5?mode=gi_t
> ² https://chat.whatsapp.com/KmtMAc6JOXEE2PvsHhX7SJ?mode=gi_t

* *full-message*
> *_${v.full_message}_*

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ | ᴀʀꜱʟᴀɴ ᴍᴅ`

                await conn.sendMessage(CHANNEL_ID, { text: message })
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
    if(!code) return reply("💡 *Usage:* .numbers2 92")

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
*ᴊᴏɪɴ: ${CHANNEL_LINK}*

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ | ᴀʀꜱʟᴀɴ ᴍᴅ*`

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
