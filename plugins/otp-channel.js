const axios = require("axios");
const fs = require("fs");
const { cmd } = require("../command");

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers";
const OTP_API = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/msi?type=sms";

// SETTINGS
const CHANNEL = "120363424268743982@newsletter";
const OWNER_NUMBER = "923325914867";

let running = false;
let sent = new Set();

/* =========================
   UTILS
========================= */
function getCountry(num){
    if(num.startsWith("92")) return "🇵🇰 Pakistan";
    if(num.startsWith("91")) return "🇮🇳 India";
    if(num.startsWith("1")) return "🇺🇸 USA";
    if(num.startsWith("44")) return "🇬🇧 UK";
    if(num.startsWith("58")) return "🇻🇪 Venezuela";
    return "🌍 Unknown";
}

function hideNumber(num){
    const last4 = num.slice(-4);
    return "+" + num.slice(0,2) + "******" + last4;
}

/* =========================
   OTP MONITORING (FIXED LOOP)
========================= */
cmd({
    pattern: "otpstart",
    react: "🚀",
    desc: "Start non-stop OTP Monitoring",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER_NUMBER)) return reply("❌ Access Denied.");
    if (running) return reply("⚠️ Monitoring is already running.");

    running = true;
    reply("🚀 *OTP Monitoring Started! (Sync Fixed)*");

    while(running){
        try {
            const { data } = await axios.get(OTP_API);
            
            if (data && data.result && Array.isArray(data.result)) {
                for (const v of data.result) {
                    // Unique ID based on Number + OTP + Time to ensure freshness
                    const uniqueID = `${v.number}_${v.otp}_${v.time}`;

                    if (!sent.has(uniqueID)) {
                        await conn.sendMessage(CHANNEL, {
                            text: `🔐 *NEW OTP RECEIVED*

🌍 *Country* : ${getCountry(v.number)}
📱 *Number* : ${hideNumber(v.number)}
📲 *Service* : ${v.service}
🔑 *OTP* : ${v.otp}
⏰ *Time* : ${v.time}`
                        });

                        sent.add(uniqueID);

                        // Memory clean: Purana data flush karein taaki bot heavy na ho
                        if (sent.size > 100) {
                            const firstValue = sent.values().next().value;
                            sent.delete(firstValue);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Monitoring Error: ", e.message);
        }
        
        // Interval ko 5-10 seconds rakhein taaki API block na ho
        await new Promise(r => setTimeout(r, 8000));
    }
});

cmd({
    pattern: "otpstop",
    react: "🛑",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER_NUMBER)) return;
    running = false;
    reply("🛑 *OTP Monitoring Stopped.*");
});
   
