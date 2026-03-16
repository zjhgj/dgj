const { cmd } = require('../command');
const axios = require('axios');

// Settings
const TARGET_JID = "120363425374615077@newsletter"; 
const API_URL = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms";
const MY_NUMBER = "923325914867"; // Aapka number

let otpTimer = null;
let lastMsg = "";

cmd({
    pattern: "startotp",
    desc: "Force-Allowed OTP Monitor",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, isOwner, reply }) => {
    
    // LID/Sender ID se number extract karna
    const senderNum = (sender || '').replace(/[^0-9]/g, '');
    
    // FORCE CHECK: Agar isOwner false hai, toh bhi number match karein
    const isAuthorized = isOwner || senderNum.includes(MY_NUMBER);

    if (!isAuthorized) {
        return reply("❌ Access Denied. Sender: " + senderNum);
    }

    if (otpTimer) return reply("⚠️ Monitoring already active.");

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    reply("🚀 *OTP Monitor Started!*\nStatus: Force-Authorized\nTarget: Channel");

    otpTimer = setInterval(async () => {
        try {
            const res = await axios.get(API_URL);
            const currentOTP = res.data?.result?.message || res.data?.message;

            if (currentOTP && currentOTP !== lastMsg) {
                lastMsg = currentOTP;
                const text = `🔔 *OTP RECEIVED*\n\n📩 ${currentOTP}\n\n> © KAMRAN-MD`;

                // Channel mein send karein
                await conn.sendMessage(TARGET_JID, { text: text }).catch(e => {
                    console.log("❌ Send Error:", e.message);
                });
            }
        } catch (e) {
            console.log("📡 API Error");
        }
    }, 10000); 
});
