const { cmd } = require("../command");

// CONFIGURATION (Fixing IDs from your screenshots)
const SOURCE_CHANNEL = "120363319455353564@newsletter"; // Zaynix OTP ya source channel
const MY_CHANNEL = "120363425374615077@newsletter";     // Aapka OTP RECEIVE channel
const MY_GROUP = "120363390312683838@g.us";            // Aapka Target Group
const OWNER_NUMBERS = ["923325914867", "923147168309"]; // Authorized numbers

let forwardActive = false;

// 1. OTP START COMMAND
cmd({
    pattern: "startotp2",
    react: "🚀",
    desc: "Start automatic OTP forwarding",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    // Force authorization fix
    const isOwner = OWNER_NUMBERS.some(num => sender.includes(num));
    if (!isOwner) return reply("❌ Access Denied. Sender not authorized.");

    if (forwardActive) return reply("⚠️ Monitoring is already running.");

    forwardActive = true;
    reply("🚀 *OTP Monitor Started (LID Fixed)!*\n\nStatus: Force-Authorized\nTarget: Channel & Group");
});

// 2. OTP STOP COMMAND
cmd({
    pattern: "stopotp2",
    react: "🛑",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    const isOwner = OWNER_NUMBERS.some(num => sender.includes(num));
    if (!isOwner) return;
    forwardActive = false;
    reply("🛑 *OTP Monitoring Stopped.*");
});

// 3. AUTO-FORWARD LOGIC (The Main Fix)
conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        if (!forwardActive) return;
        
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        
        const from = m.key.remoteJid;
        
        // Agar message Zaynix ya source channel se aaye
        if (from === SOURCE_CHANNEL) {
            const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
            
            // Check agar message mein OTP ya Code hai
            if (text.includes("OTP") || text.includes("code") || text.includes("WhatsApp")) {
                const finalMsg = `🔐 *NEW OTP RECEIVED*\n\n${text}\n\n*DR KAMRAN-MD AUTO SYSTEM*`;

                // Apne channel mein bhejein
                await conn.sendMessage(MY_CHANNEL, { text: finalMsg });
                // Apne group mein bhejein
                await conn.sendMessage(MY_GROUP, { text: finalMsg });
                
                console.log("✅ OTP successfully forwarded!");
            }
        }
    } catch (e) {
        console.error("Forwarder Error:", e.message);
    }
});
