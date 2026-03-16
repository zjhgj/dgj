const { cmd } = require('../command');
const axios = require('axios');

// Numeric extraction helper for LID/JID
const getNum = (id) => (id || '').split('@')[0].split(':')[0];

// Newsletter JID from your screenshots
const TARGET_JID = "120363425374615077@newsletter"; 
const API_URL = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms";

let otpTimer = null;
let lastMsg = "";

cmd({
    pattern: "startotp",
    desc: "LID Fixed OTP Monitoring",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, isOwner, reply }) => {
    
    // LID Fix: Manual numeric check if standard isOwner fails
    const senderNum = getNum(sender);
    const isKamran = isOwner || (senderNum === "923325914867") || (senderNum === "923325914867");

    if (!isKamran) return reply("❌ Access Denied.");
    if (otpTimer) return reply("⚠️ Monitoring already active.");

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    reply("🚀 *OTP Monitor Started (LID Fixed)*\n\nChannel JID: " + TARGET_JID);

    otpTimer = setInterval(async () => {
        try {
            const res = await axios.get(API_URL);
            const currentOTP = res.data?.result?.message || res.data?.message;

            if (currentOTP && currentOTP !== lastMsg) {
                lastMsg = currentOTP;

                const text = `🔔 *OTP RECEIVED*\n\n` +
                             `📩 *Msg:* ${currentOTP}\n` +
                             `⏰ *Time:* ${new Date().toLocaleTimeString()}\n\n` +
                             `> © KAMRAN-MD`;

                // Logic: Newsletter/Channel ke liye hamesha JID use karein
                await conn.sendMessage(TARGET_JID, { text }).catch(err => {
                    console.log("❌ Channel Send Error (Check if bot is admin):", err.message);
                });
            }
        } catch (e) {
            console.log("📡 API Connection Error...");
        }
    }, 10000); 
});

cmd({ pattern: "stopotp", category: "owner" }, async (conn, mek, m, { reply }) => {
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
        reply("🛑 OTP Service Stopped.");
    }
});
        
