const { cmd } = require('../command');
const axios = require('axios');

// Settings from your screenshot
const TARGET_NEWSLETTER = "120363425374615077@newsletter"; 
const API_URL = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms";

let monitoring = false;
let lastOTP = ""; // Purane OTP ko filter karne ke liye

cmd({
    pattern: "startotp",
    desc: "Start OTP Monitoring",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Only Owner can start monitoring.");
    if (monitoring) return reply("⚠️ Monitoring is already running.");

    monitoring = true;
    reply("🚀 *OTP Monitoring Started...*\nTarget: " + TARGET_NEWSLETTER);

    setInterval(async () => {
        try {
            const res = await axios.get(API_URL);
            
            // API se data nikalna (Flexible check)
            const otpMsg = res.data?.result?.message || res.data?.data?.message || res.data?.message;

            if (otpMsg && otpMsg !== lastOTP) {
                lastOTP = otpMsg; // Naya OTP save karein
                
                const finalMsg = `🔔 *NEW OTP RECEIVED*\n\n` +
                                 `📩 *Message:* ${otpMsg}\n` +
                                 `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                                 `> © KAMRAN-MD MONITOR`;

                // Channel mein send karein
                await conn.sendMessage(TARGET_NEWSLETTER, { text: finalMsg });
                console.log("✅ OTP Forwarded to Channel");
            } else {
                console.log("ℹ️ No new OTP detected yet...");
            }
        } catch (e) {
            console.error("❌ Monitor Error:", e.message);
        }
    }, 10000); // 10 seconds check interval
});
