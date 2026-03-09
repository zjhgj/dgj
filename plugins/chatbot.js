const { cmd } = require('../command');
const axios = require('axios');

// Safe memory initialization
if (!global.autoAiStatus) global.autoAiStatus = {}; 

cmd({
    pattern: "autoai",
    alias: ["aiauto", "aion"], // Added aliases for your convenience
    desc: "Enable/Disable Auto AI for this chat.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    if (!isAdmins && !isOwner) return reply("❌ Only Admins can use this.");
    
    if (!q) return reply("❓ *Usage:* .autoai on / off");

    if (q.toLowerCase() === 'on') {
        global.autoAiStatus[from] = true;
        return reply("✅ *Auto AI is now ON.* I will reply to normal messages.");
    } else {
        global.autoAiStatus[from] = false;
        return reply("❌ *Auto AI is now OFF.*");
    }
});

// Listener for automatic replies
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isBot }) => {
    // 1. Safety checks
    if (!global.autoAiStatus || !global.autoAiStatus[from]) return;
    if (m.key.fromMe || isBot || !body) return; // Prevent bot talking to itself
    if (body.startsWith('.') || body.startsWith('/')) return; // Ignore commands

    try {
        await conn.sendPresenceUpdate('composing', from);

        // Fetch AI response
        const res = await axios.get(`https://api.ryuu-dev.offc.my.id/ai/mahiru-ai?text=${encodeURIComponent(body)}`, { timeout: 10000 });
        
        if (res.data && res.data.output) {
            await conn.sendMessage(from, { text: res.data.output.trim() }, { quoted: mek });
        }
    } catch (e) {
        console.error("AutoAI Plugin Error:", e.message);
    }
});
