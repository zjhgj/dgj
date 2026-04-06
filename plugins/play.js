const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

// API Configuration
const OTP_API = "https://drkamran-api-site.vercel.app/api/search/yts";
const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb7QIUD5kg7FngcRYY1N";

let sessions = {};

/* --- 🌍 COUNTRY HELPER --- */
function getCountry(num) {
    const countryCodes = { "92": "🇵🇰 Pakistan", "91": "🇮🇳 India", "1": "🇺🇸 USA", "44": "🇬🇧 UK", "971": "🇦🇪 UAE" }; 
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
    desc: "Forward ONLY NEW OTPs",
    category: "tools",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sender }) => {
    
    if (!sessions[sender]) {
        sessions[sender] = { target: null, running: false, sentIds: new Set() };
    }

    const userSession = sessions[sender];
    const subCommand = args[0] ? args[0].toLowerCase() : "";

    if (subCommand === 'set') {
        const jid = args[1];
        if (!jid || !jid.includes('@')) return reply("❌ *Usage:* `.otp set JID@newsletter` ");
        userSession.target = jid.trim();
        return reply(`✅ *Target Saved:* \`${userSession.target}\``);
    }

    if (subCommand === 'start') {
        if (!userSession.target) return reply("⚠️ *Set JID first!*");
        if (userSession.running) return reply("⚠️ *Already running!*");

        // --- STEP 1: INITIAL SCAN (Purane OTPs ko ignore karne ke liye) ---
        try {
            const initialRes = await axios.get(OTP_API);
            if (initialRes.data && initialRes.data.result) {
                initialRes.data.result.forEach(v => {
                    const oldId = `${v.number}_${v.otp}_${v.service}`.trim();
                    userSession.sentIds.add(oldId); // Saare purane IDs database mein daal diye
                });
            }
        } catch (e) { console.log("Initial scan error"); }

        userSession.running = true;
        reply(`🚀 *Monitoring Started!*\nAb sirf **Naye OTPs** forward honge. Purane ignore kar diye gaye hain.`);

        // --- STEP 2: REAL-TIME MONITORING LOOP ---
        while (userSession.running) {
            try {
                const { data } = await axios.get(OTP_API, {
                    headers: { 'Cache-Control': 'no-cache' }
                });

                if (data && data.result) {
                    for (const v of data.result) {
                        const uniqueId = `${v.number}_${v.otp}_${v.service}`.trim();
                        
                        // Agar yeh ID pehle se nahi hai, toh hi send karo
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

*MESSAGE DETAIL:*
> _${v.full_message}_

📢 *Source:* ${CHANNEL_LINK}
> *POWERED BY KAMRAN-MD*`;

                            await conn.sendMessage(userSession.target, { text: caption });
                            userSession.sentIds.add(uniqueId);
                        }
                    }
                }
            } catch (err) { console.log("Loop Error:", err.message); }
            
            await new Promise(resolve => setTimeout(resolve, 8000)); // 8 seconds delay
        }
    }

    if (subCommand === 'stop') {
        userSession.running = false;
        userSession.sentIds.clear(); // Stop hone par list clear kar den
        return reply("🛑 *OTP Monitoring Stopped.*");
    }
});
