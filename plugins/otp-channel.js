const axios = require("axios");
const fs = require("fs");
const { cmd } = require("../command");

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers";
const OTP_API = "https://arslan-apis.vercel.app/more/liveotp";
const CHANNEL = "120363424268743982@newsletter";
const OWNER = "923325914867"; // Aapka number check ke liye

let running = false;
let sent = new Set();

/* =========================
   UTILS
========================= */
function getCountry(num) {
    if (num.startsWith("92")) return "🇵🇰 Pakistan";
    if (num.startsWith("91")) return "🇮🇳 India";
    if (num.startsWith("1")) return "🇺🇸 USA";
    if (num.startsWith("44")) return "🇬🇧 UK";
    return "🌍 Unknown";
}

function hideNumber(num) {
    return "+" + num.slice(0, 2) + "******" + num.slice(-4);
}

/* =========================
   NUMBERS COMMAND
========================= */
cmd({
    pattern: "numbers",
    react: "📱",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    const code = args[0];
    if (!code) return reply("Example: .numbers 92");
    try {
        const { data } = await axios.get(NUMBERS_API);
        const numbers = data.result.filter(v => v.startsWith(code));
        if (!numbers.length) return reply("❌ Country not available");
        const file = `numbers-${code}.txt`;
        fs.writeFileSync(file, numbers.map(v => "+" + v).join("\n"));
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(file),
            mimetype: "text/plain",
            fileName: file,
            caption: `📱 Numbers (${code})\nTotal: ${numbers.length}`
        }, { quoted: mek });
        fs.unlinkSync(file);
    } catch (e) { reply("Error fetching numbers"); }
});

/* =========================
   OTP START (FIXED FOR NEW MESSAGES)
========================= */
cmd({
    pattern: "otpstart",
    react: "🚀",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER)) return reply("❌ Only Owner can start!");
    if (running) return reply("⚠️ OTP Forward already running");

    running = true;
    reply("🚀 *OTP Forwarding Started!*");

    while (running) {
        try {
            const { data } = await axios.get(OTP_API);
            
            if (data && data.result && Array.isArray(data.result)) {
                for (const v of data.result) {
                    // Unique ID: Number + OTP + Service (Taaki agar same number par naya OTP aaye toh wo send ho)
                    const id = `${v.number}_${v.otp}_${v.service}`;

                    if (!sent.has(id)) {
                        await conn.sendMessage(CHANNEL, {
                            text: `🔐 *NEW OTP RECEIVED*

🌍 *Country* : ${getCountry(v.number)}
📱 *Number* : ${hideNumber(v.number)}
📲 *Service* : ${v.service}
🔑 *OTP* : ${v.otp}
⏰ *Time* : ${v.time || new Date().toLocaleTimeString()}`
                        });

                        sent.add(id);

                        // Memory clean up: Agar 1000 se zyada ho jayein toh purane delete karein
                        if (sent.size > 1000) {
                            const firstItem = sent.values().next().value;
                            sent.delete(firstItem);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Loop Error:", e.message);
        }
        await new Promise(r => setTimeout(r, 10000)); // 10 seconds gap
    }
});

/* =========================
   OTP STOP
========================= */
cmd({
    pattern: "otpstop",
    react: "🛑",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER)) return;
    running = false;
    reply("🛑 *OTP Forward Stopped*");
});
