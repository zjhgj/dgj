const axios = require("axios");
const { cmd } = require("../command"); // Apne command loader ke hisaab se path check karein

const OTP_API = "https://arslan-apis.vercel.app/otp/messages";
const CHANNEL_JID = "120363425374615077@newsletter"; // Yahan apni Newsletter JID daalein

let running = false;
let sent = new Set();

// Utility Functions
function getCountry(num) {
    if (num.startsWith("92")) return "🇵🇰 Pakistan";
    if (num.startsWith("91")) return "🇮🇳 India";
    return "🌍 Unknown";
}

function hideNumber(num) {
    return "+" + num.slice(0, 2) + "******" + num.slice(-4);
}

// OTP Start Command
cmd({
    pattern: "otpstart",
    react: "🚀",
    desc: "Start OTP Forward to Channel",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    if (running) return reply("⚠️ OTP Forward already running.");
    
    running = true;
    reply("🚀 *OTP Forwarding Started!*");

    // Loop
    while (running) {
        try {
            const { data } = await axios.get(OTP_API);
            
            if (data && data.result) {
                for (const v of data.result) {
                    const id = v.number + v.otp;
                    if (sent.has(id)) continue;

                    const msg = `🔐 *NEW OTP RECEIVED*\n\n` +
                                `🌍 Country : ${getCountry(v.number)}\n` +
                                `📱 Number : ${hideNumber(v.number)}\n` +
                                `📲 Service : ${v.service}\n` +
                                `🔑 OTP : *${v.otp}*\n` +
                                `⏰ Time : ${v.time}`;

                    // Sending to CHANNEL_JID
                    await conn.sendMessage(CHANNEL_JID, { text: msg });
                    
                    sent.add(id);
                    // Memory manage karne ke liye set size check
                    if (sent.size > 500) sent.clear(); 
                }
            }
        } catch (e) {
            console.error("OTP Loop Error:", e.message);
        }
        
        await new Promise(r => setTimeout(r, 10000)); // 10 seconds wait
    }
});

// OTP Stop Command
cmd({
    pattern: "otpstop",
    react: "🛑",
    desc: "Stop OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    running = false;
    reply("🛑 *OTP Forward Stopped.*");
});
