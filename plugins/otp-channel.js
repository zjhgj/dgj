const { cmd } = require('../command');
const axios = require('axios');

// Numeric LID Extraction Helper
const getNum = (id) => (id || '').split('@')[0].split(':')[0];

const TARGET_CHANNEL = "120363425374615077@newsletter"; 
const API_URL = "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms";

let otpInterval = null;
let lastSavedOTP = "";

cmd({
    pattern: "startotp",
    desc: "Monitor OTP with LID Fix",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, isOwner, reply }) => {
    
    // --- LID Fix Logic ---
    // User Summary ke mutabiq Owner ID 923237045919 hai
    const ownerNumeric = "923325914867"; 
    const senderNumeric = getNum(sender);
    
    // Agar standard isOwner fail ho, toh LID/Numeric check karein
    const finalOwnerCheck = isOwner || (senderNumeric === ownerNumeric);

    if (!finalOwnerCheck) return reply("❌ Only DR KAMRAN can start this service.");
    if (otpInterval) return reply("⚠️ Monitoring is already running.");

    await conn.sendMessage(from, { react: { text: "🚀", key: m.key } });
    reply("🚀 *OTP Monitor Started!*\nLID Verification: ✅\nTarget: OTP RECEIVE Channel");

    otpInterval = setInterval(async () => {
        try {
            const response = await axios.get(API_URL);
            
            // API Response handling
            const currentOTP = response.data?.result?.message || response.data?.message || response.data?.data?.message;

            if (currentOTP && currentOTP !== lastSavedOTP) {
                lastSavedOTP = currentOTP;

                const otpText = `⚡ *KAMRAN-MD OTP RECEIVED*\n\n` +
                                `📝 *Message:* ${currentOTP}\n` +
                                `⏰ *Time:* ${new Date().toLocaleTimeString()}\n\n` +
                                `> © DR KAMRAN`;

                // Sending to Newsletter/Channel
                await conn.sendMessage(TARGET_CHANNEL, { text: otpText });
                console.log("✅ OTP Forwarded to:", TARGET_CHANNEL);
            }
        } catch (error) {
            console.error("OTP Fetch Error:", error.message);
        }
    }, 10000); // 10 seconds interval
});

// Stop Command with LID Fix
cmd({ pattern: "stopotp", category: "owner" }, async (conn, mek, m, { sender, isOwner, reply }) => {
    const senderNumeric = getNum(sender);
    if (!isOwner && senderNumeric !== "923325914867") return;

    if (otpInterval) {
        clearInterval(otpInterval);
        otpInterval = null;
        reply("🛑 OTP Monitoring Stopped.");
    }
});
