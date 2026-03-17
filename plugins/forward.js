const { cmd } = require("../command");

// CONFIGURATION
const SOURCE_CHANNEL = "120363319455353564@newsletter"; // Jis channel se OTP lena hai
const MY_CHANNEL = "120363424268743982@newsletter";     // Aapka apna channel
const OWNER_NUMBER = "923325914867";

let forwardActive = false;

/* =========================
   FORWARDER COMMANDS
========================= */

// Start Forwarding
cmd({
    pattern: "fwdstart",
    react: "🔄",
    desc: "Start forwarding from source channel",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER_NUMBER)) return reply("❌ Only Owner!");
    forwardActive = true;
    reply("✅ *OTP Forwarding System Active!*\n\nMonitoring source channel for new messages...");
});

// Stop Forwarding
cmd({
    pattern: "fwdstop",
    react: "🛑",
    desc: "Stop forwarding",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    if (!sender.includes(OWNER_NUMBER)) return;
    forwardActive = false;
    reply("🛑 *Forwarding Stopped.*");
});

/* =========================
   CORE LOGIC (AUTO-FORWARD)
========================= */

// Ye function har aane wale message ko check karega
conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        if (!forwardActive) return;
        
        const m = chatUpdate.messages[0];
        if (!m.message) return;
        
        // Check agar message us source channel se aaya hai
        const from = m.key.remoteJid;
        
        if (from === SOURCE_CHANNEL) {
            const text = m.message.conversation || m.message.extendedTextMessage?.text;
            
            if (text && (text.includes("OTP") || text.includes("code"))) {
                // Apne channel mein forward karna
                await conn.sendMessage(MY_CHANNEL, {
                    text: `📢 *FORWARDED OTP*\n\n${text}\n\n*DR KAMRAN-MD AUTO SYSTEM*`
                });
                console.log("✅ OTP Forwarded Successfully!");
            }
        }
    } catch (e) {
        console.error("Forwarder Error:", e.message);
    }
});

