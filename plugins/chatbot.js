const { cmd } = require('../command');
const axios = require('axios');

// Initialize memory safely
if (!global.autoAiStatus) global.autoAiStatus = {}; 

cmd({
    pattern: "autoai",
    desc: "Enable/Disable Auto AI for this chat.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    if (!isAdmins && !isOwner) return reply("❌ Admins only.");
    
    if (!q) return reply("❓ *Usage:* .autoai on / off");

    if (q.toLowerCase() === 'on') {
        global.autoAiStatus[from] = true;
        return reply("✅ *Auto AI is now ON.* I will reply to users.");
    } else {
        global.autoAiStatus[from] = false;
        return reply("❌ *Auto AI is now OFF.*");
    }
});

// Listener that only acts when the AI is ON
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isBot }) => {
    // Basic gatekeepers to prevent crashes
    if (!global.autoAiStatus || !global.autoAiStatus[from]) return;
    if (m.key.fromMe || isBot || !body) return; // Ignore self and other bots
    if (body.startsWith('.') || body.startsWith('/')) return; // Ignore commands

    try {
        await conn.sendPresenceUpdate('composing', from);

        // Added 10-second timeout to prevent the bot from hanging
        const res = await axios.get(`https://api.ryuu-dev.offc.my.id/ai/mahiru-ai?text=${encodeURIComponent(body)}`, { timeout: 10000 });
        
        if (res.data && res.data.output) {
            await conn.sendMessage(from, { text: res.data.output.trim() }, { quoted: mek });
        }
    } catch (e) {
        console.error("AI Error:", e.message);
        // We don't reply with error to avoid spamming the chat
    }
});
