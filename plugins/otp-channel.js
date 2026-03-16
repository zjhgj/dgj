const axios = require("axios");
const fs = require("fs");
const { cmd } = require("../command");

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers";
const OTP_API = "https://arslan-apis.vercel.app/otp/messages";

// SETTINGS
const CHANNEL = "120363425374615077@newsletter"; 
const OWNER_NUMBER = "923325914867";

let running = false;
let sent = new Set();

/* =========================
   UTILS
========================= */
function getCountry(num){
    if(num.startsWith("92")) return "🇵🇰 Pakistan";
    if(num.startsWith("91")) return "🇮🇳 India";
    return "🌍 Unknown";
}

function hideNumber(num){
    return "+" + num.slice(0,2) + "******" + num.slice(-4);
}

/* =========================
   1. NUMBERS COMMAND
========================= */
cmd({
    pattern: "numbers",
    react: "📱",
    desc: "Get numbers by country code",
    category: "tools",
    use: ".numbers 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    const code = args[0];
    if(!code) return reply("Example: .numbers 92");

    try {
        const { data } = await axios.get(NUMBERS_API);
        const numbers = data.result.filter(v => v.startsWith(code));
        if(!numbers.length) return reply("❌ Country not available");

        const file = `numbers-${code}.txt`;
        fs.writeFileSync(file, numbers.map(v => "+" + v).join("\n"));

        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(file),
            mimetype: "text/plain",
            fileName: file,
            caption: `📱 Numbers (${code})\nTotal: ${numbers.length}`
        }, { quoted: mek });

        fs.unlinkSync(file);
    } catch(e) {
        reply("Error fetching numbers");
    }
});

/* =========================
   2. OTP START (WITH LOGGING)
========================= */
cmd({
    pattern: "otpstart",
    react: "🚀",
    desc: "Start OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    // Owner Check
    if (!sender.includes(OWNER_NUMBER)) return reply("❌ Only Owner!");
    if (running) return reply("⚠️ Already running");

    running = true;
    reply("🚀 *OTP Forwarding Started!*");

    while(running){
        try {
            const { data } = await axios.get(OTP_API);
            
            if (data?.result && Array.isArray(data.result)) {
                for(const v of data.result){
                    const id = v.number + v.otp;
                    if(sent.has(id)) continue;

                    // Sending to Newsletter
                    await conn.sendMessage(CHANNEL, {
                        text: `🔐 *NEW OTP RECEIVED*\n\n🌍 Country: ${getCountry(v.number)}\n📱 Number: ${hideNumber(v.number)}\n📲 Service: ${v.service}\n🔑 OTP: *${v.otp}*\n⏰ Time: ${v.time}`
                    }).then(() => {
                        console.log("✅ OTP Sent to Channel!");
                        sent.add(id);
                    }).catch(err => {
                        console.error("❌ Send Failed (Check if Bot is Admin):", err.message);
                    });
                }
            }
        } catch(e) { 
            console.error("API Fetch Error:", e.message); 
        }
        await new Promise(r => setTimeout(r, 10000));
    }
});

/* =========================
   3. OTP STOP
========================= */
cmd({
    pattern: "otpstop",
    react: "🛑",
    desc: "Stop OTP Forward",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER_NUMBER)) return reply("❌ Only Owner!");
    running = false;
    reply("🛑 *OTP Forward Stopped*");
});
