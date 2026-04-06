const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

// API Configuration
const OTP_API = "https://drkamran-api-site.vercel.app/api/search/yts";
const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb7QIUD5kg7FngcRYY1N";

let sessions = {};

// --- 🌍 ALL COUNTRY DATABASE ---
function getCountry(num) {
    const countryCodes = { "92": "🇵🇰 Pakistan", "91": "🇮🇳 India", "1": "🇺🇸 USA", "44": "🇬🇧 UK", "971": "🇦🇪 UAE", "966": "🇸🇦 Saudi Arabia" };
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
    desc: "Fastest Multi-user OTP Forwarder",
    category: "tools",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sender }) => {
    
    if (!sessions[sender]) {
        sessions[sender] = { target: null, running: false, sentIds: new Set() };
    }

    const userSession = sessions[sender];
    const subCommand = args[0] ? args[0].toLowerCase() : "";

    // 1. SET TARGET
    if (subCommand === 'set') {
        const jid = args[1];
        if (!jid || !jid.includes('@')) return reply("❌ *Usage:* `.otp set JID@newsletter` ");
        userSession.target = jid.trim();
        return reply(`✅ *Target Saved:* \`${userSession.target}\``);
    }

    // 2. START MONITORING (Fast & Fresh)
    if (subCommand === 'start') {
        if (!userSession.target) return reply("⚠️ *JID Set Karein Pehle!*");
        if (userSession.running) return reply("⚠️ *Pehle se chal raha hai!*");

        // --- STEP 1: Fast Initial Scan (Ignore Old Data) ---
        try {
            const initial = await axios.get(OTP_API, { headers: { 'Cache-Control': 'no-cache' } });
            if (initial.data && initial.data.result) {
                initial.data.result.forEach(v => {
                    userSession.sentIds.add(`${v.number}_${v.otp}`);
                });
            }
        } catch (e) { console.log("Init Error"); }

        userSession.running = true;
        reply(`🚀 *Instant OTP Mode Active!*\nAb sirf naye OTPs bhejunga.\n🎯 *Forwarding to:* \`${userSession.target}\``);

        // --- STEP 2: High-Speed Loop ---
        while (userSession.running) {
            try {
                const response = await axios.get(OTP_API, { 
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } 
                });

                if (response.data && response.data.result) {
                    for (const v of response.data.result) {
                        const uniqueId = `${v.number}_${v.otp}`;
                        
                        if (!userSession.sentIds.has(uniqueId)) {
                            const caption = `┏━♡━━━━━━━🪀━━━━━━━♡━┓
  🔥 *NEW OTP DETECTED* 🔥
┗━♡━━━━━━━🪀━━━━━━━♡━┛

┌────────────────────┈⊷
│ 🌍 *COUNTRY* : ${getCountry(v.number)}
│ 📱 *NUMBER* : ${maskNum(v.number)}
│ 📲 *SERVICE* : ${v.service.toUpperCase()}
│ 🔑 *OTP CODE* : *${v.otp}*
└────────────────────┈⊷

📢 *Official Channel:* ${CHANNEL_LINK}
> *POWERED BY KAMRAN-MD*`;

                            await conn.sendMessage(userSession.target, { text: caption });
                            userSession.sentIds.add(uniqueId);
                            
                            // RAM safe rakhne ke liye list clean karein
                            if (userSession.sentIds.size > 200) {
                                const first = userSession.sentIds.values().next().value;
                                userSession.sentIds.delete(first);
                            }
                        }
                    }
                }
            } catch (err) {
                console.log("Fetch Error:", err.message);
            }
            // 5 Seconds interval for speed
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // 3. STOP
    if (subCommand === 'stop') {
        userSession.running = false;
        userSession.sentIds.clear();
        return reply("🛑 *OTP Monitoring Stopped.*");
    }
});
