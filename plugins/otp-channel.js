const axios = require("axios");
const { cmd } = require("../command");

const OWNER = "923325914867";
const CHANNELS = [
    "120363425374615077@newsletter",
    "120363424268743982@newsletter"
];

const API_URLS = [
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
];

let isRunning = false;
let cache = new Set();

cmd({
    pattern: "otpstart",
    react: "🚀",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER)) return reply("❌ Only Owner!");
    if (isRunning) return reply("⚠️ Monitoring is already running.");

    isRunning = true;
    reply("🚀 *Arslan-MD OTP Monitoring Activated!*");

    while (isRunning) {
        for (const url of API_URLS) {
            try {
                const { data } = await axios.get(url);
                if (data?.result && Array.isArray(data.result)) {
                    for (const v of data.result) {
                        const id = `${v.number}_${v.otp}`;
                        if (cache.has(id)) continue;

                        const msg = `🔐 *NEW OTP RECEIVED*\n\n🌍 *Number:* ${v.number}\n📲 *Service:* ${v.service}\n🔑 *OTP:* ${v.otp}\n⏰ *Time:* ${v.time}\n\n*DR KAMRAN-MD SYSTEM*`;

                        for (const jid of CHANNELS) {
                            await conn.sendMessage(jid, { text: msg }).catch(e => {
                                console.log(`❌ Error sending to ${jid}:`, e.message);
                            });
                        }
                        cache.add(id);
                        if (cache.size > 500) cache.clear();
                    }
                }
            } catch (e) {
                console.log(`API Error on ${url}:`, e.message);
            }
        }
        await new Promise(r => setTimeout(r, 6000)); // 6 Seconds Interval
    }
});

cmd({
    pattern: "otpstop",
    react: "🛑",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER)) return;
    isRunning = false;
    reply("🛑 *Monitoring Stopped.*");
});
