const { cmd } = require('../command');
const axios = require('axios');

const TARGET_JID = "120363425374615077@newsletter"; 
const API_URL = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms";
const OWNER_NUM = "923325914867"; // Aapka number

let otpTimer = null;

cmd({
    pattern: "startotp",
    desc: "Force Bypass OTP Monitor",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    
    // Yahan hum manual check kar rahe hain
    const isOwnerByNum = sender.includes(OWNER_NUM);
    
    // Agar sender channel ID hai ya aapka number, toh allow karein
    if (!isOwnerByNum && sender !== TARGET_JID) {
        return reply("❌ Access Denied. Sender ID detected: " + sender);
    }

    if (otpTimer) return reply("⚠️ Monitoring already running.");

    reply("🚀 *Force Monitoring Started for Channel!*");

    otpTimer = setInterval(async () => {
        try {
            const res = await axios.get(API_URL);
            const currentOTP = res.data?.result?.message || res.data?.message;

            if (currentOTP) {
                // Forcefully target the JID
                await conn.sendMessage(TARGET_JID, { text: `🔔 OTP: ${currentOTP}` })
                    .catch(e => console.log("Final Error:", e.message));
            }
        } catch (e) {
            console.log("API Fail");
        }
    }, 10000);
});
                
