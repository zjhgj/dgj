const { cmd } = require("../command");

// CONFIGURATION
const SOURCE_CHANNEL = "120363319455353564@newsletter"; 
const MY_CHANNEL = "120363425374615077@newsletter";     
const MY_GROUP = "120363390312683838@g.us";            
const OWNER_NUMBERS = ["923325914867", "92337045919"]; 

// Global State
if (global.forwardActive === undefined) global.forwardActive = false;

// 1. START OTP
cmd({
    pattern: "startotp",
    react: "🚀",
    desc: "Start automatic OTP forwarding",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    const isOwner = OWNER_NUMBERS.some(num => sender.includes(num));
    if (!isOwner) return reply("❌ Access Denied.");

    if (global.forwardActive) return reply("⚠️ Monitoring is already live.");

    global.forwardActive = true;
    reply("🚀 *OTP Monitor Started!*\n\nKeep-Alive: Enabled\nTarget: Channel & Group");
});

// 2. STOP OTP
cmd({
    pattern: "stopotp",
    react: "🛑",
    filename: __filename
},
async (conn, mek, m, { reply, sender }) => {
    const isOwner = OWNER_NUMBERS.some(num => sender.includes(num));
    if (!isOwner) return;
    global.forwardActive = false;
    reply("🛑 *OTP Monitoring Stopped.*");
});

// 3. AUTO-FORWARDER (STABLE LOGIC)
conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        if (!global.forwardActive) return;
        
        const m = chatUpdate.messages[0];
        if (!m || !m.message || m.key.fromMe) return;
        
        const from = m.key.remoteJid;
        
        // Listen only to source channel
        if (from === SOURCE_CHANNEL) {
            const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.newsletterExternalUpdate?.text || "";
            
            // Check for OTP Keywords
            if (text.toLowerCase().includes("otp") || text.toLowerCase().includes("code")) {
                const finalMsg = `🔐 *NEW OTP RECEIVED*\n\n${text}\n\n*DR KAMRAN-MD MONITORING*`;

                // Parallel Sending (Tez forwarding ke liye)
                await Promise.all([
                    conn.sendMessage(MY_CHANNEL, { text: finalMsg }),
                    conn.sendMessage(MY_GROUP, { text: finalMsg })
                ]);
                
                console.log("✅ OTP Forwarded successfully.");
            }
        }
    } catch (e) {
        // Anti-Crash: Error aane par bot band nahi hoga
        console.error("Forwarder Silent Error:", e.message);
    }
});
