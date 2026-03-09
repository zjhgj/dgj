const { cmd } = require('../command');
const axios = require('axios');

// Group memory to keep track of AI status
const autoAiStatus = {}; 

cmd({
    pattern: "autoai",
    desc: "Enable/Disable Auto AI in groups.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    // Permission check
    if (!isAdmins && !isOwner) return reply("❌ This command is for Admins only.");

    if (!q) return reply("❓ Use: *.autoai on* or *.autoai off*");

    if (q.toLowerCase() === 'on') {
        autoAiStatus[from] = true;
        return reply("✅ *Auto AI:* Enabled. Bot will now reply to all messages.");
    } else if (q.toLowerCase() === 'off') {
        autoAiStatus[from] = false;
        return reply("❌ *Auto AI:* Disabled for this chat.");
    } else {
        return reply("❓ Use: *.autoai on* or *.autoai off*");
    }
});

// Listener for automatic replies
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isBot, isGroup }) => {
    // 1. Check if AI is turned ON for this chat
    if (!autoAiStatus[from]) return;
    
    // 2. Don't reply to other bots or empty messages
    if (isBot || !body) return;

    // 3. Don't reply to bot commands (starting with . or /)
    if (body.startsWith('.') || body.startsWith('/')) return;

    try {
        // Show "typing..." for realism
        await conn.sendPresenceUpdate('composing', from);

        const apiUrl = `https://api.ryuu-dev.offc.my.id/ai/mahiru-ai?text=${encodeURIComponent(body)}`;
        const res = await axios.get(apiUrl, { timeout: 10000 });
        
        if (res.data && res.data.output) {
            const replyText = res.data.output.trim();
            
            // Artificial delay based on text length
            const delay = Math.min(5000, 1000 + replyText.length * 20);
            
            setTimeout(async () => {
                await conn.sendMessage(from, { text: replyText }, { quoted: mek });
            }, delay);
        }
    } catch (e) {
        console.error("AutoAI Error:", e.message);
    }
});
