const { cmd } = require('../command');
const axios = require('axios');

// Monitor settings
const TARGET_NEWSLETTER = "120363425374615077@newsletter";
const API_URL = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms";
let monitoring = false;

cmd({
    pattern: "startotp",
    desc: "Start monitoring OTP from Heroku API",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ Only Owner can use this.");
    if (monitoring) return reply("⚠️ Monitoring is already running.");

    monitoring = true;
    reply("🚀 *OTP Monitoring Started...*\nForwarding to: " + TARGET_NEWSLETTER);

    // Interval setup (as seen in your config: Interval 6)
    setInterval(async () => {
        try {
            const res = await axios.get(API_URL);
            if (res.data && res.data.status === true) {
                const otpData = res.data.result || res.data.data;
                
                // Construct Message
                const msg = `🔔 *NEW OTP DETECTED*\n\n` +
                            `📱 *Type:* SMS\n` +
                            `📩 *Message:* ${otpData.message || "No data"}\n` +
                            `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                            `> © KAMRAN-MD OTP MONITOR`;

                // Forward to Newsletter
                await conn.sendMessage(TARGET_NEWSLETTER, { text: msg });
            }
        } catch (e) {
            console.error("OTP Monitor Error:", e.message);
        }
    }, 60000); // 1 minute check to avoid API ban
});
              
