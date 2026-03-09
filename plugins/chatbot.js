const { cmd } = require('../command');
const axios = require('axios');

const aiStatus = {}; // Group-wise status memory

// Main Command: Turn ON/OFF
cmd({
    pattern: "autoai",
    alias: ["aion", "aioff"],
    desc: "Enable or Disable Auto AI in groups.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, command, reply, isGroup, isAdmins, isOwner }) => {
    if (isGroup && !isAdmins && !isOwner) return reply("❌ Admins only.");

    if (command === 'aion') {
        aiStatus[from] = true;
        return reply("✅ *Auto AI:* Enabled for this chat.");
    }
    
    if (command === 'aioff') {
        aiStatus[from] = false;
        return reply("❌ *Auto AI:* Disabled for this chat.");
    }
});

// Listener: Auto-response logic
// Note: Isse bot.js ke message event mein integrate karna behtar hota hai
cmd({
    on: "text" 
}, async (conn, mek, m, { from, body, isBot }) => {
    if (isBot || !body || !aiStatus[from]) return;
    if (body.startsWith('.') || body.startsWith('/')) return; // Ignore commands

    try {
        await conn.sendPresenceUpdate('composing', from);

        const url = `https://api.ryuu-dev.offc.my.id/ai/mahiru-ai?text=${encodeURIComponent(body)}`;
        const res = await axios.get(url, { timeout: 10000 });
        const json = res.data;

        if (json && json.output) {
            const answer = json.output.trim();
            // Typing simulation for realism
            const typingDelay = Math.min(4000, 1000 + answer.length * 20);
            setTimeout(async () => {
                await conn.sendMessage(from, { text: answer }, { quoted: mek });
            }, typingDelay);
        }
    } catch (err) {
        console.error("AI Error:", err.message);
    }
});
