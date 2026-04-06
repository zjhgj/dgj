const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

// API Configuration
const NUMBERS_API = "https://drkamran-api-site.vercel.app/api/search/pinterest";
const OTP_API = "https://drkamran-api-site.vercel.app/api/search/yts"; // Iska result check karein agar data refresh nahi ho raha
const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb7QIUD5kg7FngcRYY1N";

// Global sessions object
let sessions = {};

/* --- 🌍 EXTENDED COUNTRY HELPER --- */
function getCountry(num) {
    const countryCodes = {
        "92": "🇵🇰 Pakistan", "91": "🇮🇳 India", "1": "🇺🇸 USA/Canada", "44": "🇬🇧 UK", "49": "🇩🇪 Germany",
        "971": "🇦🇪 UAE", "966": "🇸🇦 Saudi Arabia", "7": "🇷🇺 Russia" // ... baaki codes wahi rahenge
    };
    for (let i = 4; i >= 1; i--) {
        let prefix = num.substring(0, i);
        if (countryCodes[prefix]) return countryCodes[prefix];
    }
    return "🌍 Global Number";
}

function maskNum(num) {
    return "+" + num.slice(0, 4) + "xxx-xx" + num.slice(-2);
}

cmd({
    pattern: "otp",
    alias: ["otps", "otpstart", "otpstop"],
    desc: "Non-Stop Multi-user OTP Forwarding",
    category: "tools",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sender }) => {
    
    if (!sessions[sender]) {
        sessions[sender] = {
            target: null,
            running: false,
            sentIds: new Set()
        };
    }

    const userSession = sessions[sender];
    const subCommand = args[0] ? args[0].toLowerCase() : "";

    // --- 1. SET TARGET ---
    if (subCommand === 'set') {
        const jid = args[1];
        if (!jid || !jid.includes('@')) return reply("❌ *Usage:* `.otp set JID@newsletter` ");
        userSession.target = jid.trim();
        return reply(`✅ *Target Saved:* \`${userSession.target}\``);
    }

    // --- 2. START MONITORING (REFIXED LOOP) ---
    if (subCommand === 'start') {
        if (!userSession.target) return reply("⚠️ *Set JID first!*");
        if (userSession.running) return reply("⚠️ *Already running!*");

        userSession.running = true;
        reply(`🚀 *OTP Monitoring Active!*\nNaye OTPs aate hi forward ho jayenge.`);

        while (userSession.running) {
            try {
                // 'Cache-Control' headers add kiye hain taaki har baar fresh data aaye
                const response = await axios.get(OTP_API, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    }
                });

                const data = response.data;
                if (data && data.result && Array.isArray(data.result)) {
                    // API data ko reverse kar dete hain taaki latest pehle check ho
                    const results = data.result;

                    for (const v of results) {
                        const uniqueId = `${v.number}_${v.otp}_${v.service}`.trim();
                        
                        if (userSession.sentIds.has(uniqueId)) continue;

                        const caption = `┏━♡━━━━━━━🪀━━━━━━━♡━┓
  🔥 *NEW OTP DETECTED* 🔥
┗━♡━━━━━━━🪀━━━━━━━♡━┛

┌────────────────────┈⊷
│ 🌍 *COUNTRY* : ${getCountry(v.number)}
│ 📱 *NUMBER* : ${maskNum(v.number)}
│ 📲 *SERVICE* : ${v.service.toUpperCase()}
│ 🔑 *OTP CODE* : *${v.otp}*
└────────────────────┈⊷

*MESSAGE DETAIL:*
> _${v.full_message}_

📢 *Source:* ${CHANNEL_LINK}
> *POWERED BY KAMRAN-MD*`;

                        await conn.sendMessage(userSession.target, { text: caption });
                        userSession.sentIds.add(uniqueId);

                        // Set size limit to prevent memory leak
                        if (userSession.sentIds.size > 200) {
                            const firstIt = userSession.sentIds.values().next().value;
                            userSession.sentIds.delete(firstIt);
                        }
                    }
                }
            } catch (err) {
                console.error("Fetch Error:", err.message);
                // Agar error aaye toh thora intezar karke dobara koshish karega
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            // 10 seconds ka wait taaki API block na ho aur refresh hota rahe
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    // --- 3. STOP ---
    if (subCommand === 'stop') {
        userSession.running = false;
        return reply("🛑 *OTP Monitoring Stopped.*");
    }

    // --- 4. DEFAULT MENU ---
    if (!subCommand || !['start', 'stop', 'set'].includes(subCommand)) {
        const menu = `*🌍 GLOBAL OTP SYSTEM*
• \`.otp set <JID>\` - Set target ID.
• \`.otp start\` - Start monitoring.
• \`.otp stop\` - Stop monitoring.

🎯 *Target:* ${userSession.target || 'Not Set'}`;
        return reply(menu);
    }
});
