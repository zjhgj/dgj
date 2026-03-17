const axios = require("axios");
const { cmd } = require("../command");

// CONFIGURATION FROM YOUR JSON
const CONFIG = {
    OwnerNumber: "923325914867",
    BotName: "Kamran-MD OTP Monitoring Alive Now",
    OTPChannelIDs: [
        "120363425374615077@newsletter",
        "120363424268743982@newsletter"
    ],
    OTPAPIURLs: [
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/msi?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/np?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ts?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/kk?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/kk1?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/kk2?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/hs?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/hs1?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/hs2?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/vc?type=sms",
        "https://arslan-md-otp-apis-82e7b647a3c7.herokuapp.com/api/ivs?type=sms"
    ],
    Interval: 6000 // 6 Seconds
};

let monitoringRunning = false;
let sentOTPs = new Set();

// Command to Start Monitoring
cmd({
    pattern: "otpstart",
    react: "🚀",
    desc: "Start Arslan-MD Multi-API Monitoring",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(CONFIG.OwnerNumber)) return reply("❌ Only Owner can start monitoring.");
    if (monitoringRunning) return reply("⚠️ Monitoring is already running.");

    monitoringRunning = true;
    reply(`🚀 *${CONFIG.BotName}*\n\nMonitoring started for ${CONFIG.OTPAPIURLs.length} APIs.\nInterval: 6 Seconds.`);

    while (monitoringRunning) {
        for (const url of CONFIG.OTPAPIURLs) {
            try {
                const response = await axios.get(url);
                const data = response.data;

                if (data && data.result && Array.isArray(data.result)) {
                    for (const otp of data.result) {
                        const uniqueID = `${otp.number}_${otp.otp}_${otp.time}`;

                        if (!sentOTPs.has(uniqueID)) {
                            const message = `🔐 *NEW OTP RECEIVED*\n\n` +
                                            `🌍 *Number:* ${otp.number}\n` +
                                            `📲 *Service:* ${otp.service}\n` +
                                            `🔑 *OTP:* ${otp.otp}\n` +
                                            `⏰ *Time:* ${otp.time}\n\n` +
                                            `*Powered by Arslan-MD*`;

                            // Forward to all configured channels
                            for (const jid of CONFIG.OTPChannelIDs) {
                                await conn.sendMessage(jid, { text: message }).catch(e => console.log("Send Error:", e.message));
                            }

                            sentOTPs.add(uniqueID);
                            
                            // Memory Management
                            if (sentOTPs.size > 500) {
                                const firstValue = sentOTPs.values().next().value;
                                sentOTPs.delete(firstValue);
                            }
                        }
                    }
                }
            } catch (err) {
                console.log(`Error hitting API (${url}):`, err.message);
            }
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.Interval));
    }
});

// Command to Stop Monitoring
cmd({
    pattern: "otpstop",
    react: "🛑",
    desc: "Stop OTP Monitoring",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(CONFIG.OwnerNumber)) return;
    monitoringRunning = false;
    reply("🛑 *Monitoring Stopped Successfully.*");
});
