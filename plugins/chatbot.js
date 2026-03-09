const { cmd } = require('../command');
const axios = require('axios');

// Global Status Memory
if (!global.autoAiStatus) global.autoAiStatus = {}; 

cmd({
    pattern: "autoai",
    desc: "Enable or Disable Auto AI in the group.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    // Permission check: Admins or Owner only
    if (!isAdmins && !isOwner) return reply("❌ This command is restricted to Admins only.");
    
    if (!q) return reply("❓ *Usage:* \n.autoai on\n.autoai off");

    if (q.toLowerCase() === 'on') {
        global.autoAiStatus[from] = true;
        return reply("✅ *Auto AI:* Enabled. The bot will now reply to user messages.");
    } else if (q.toLowerCase() === 'off') {
        global.autoAiStatus[from] = false;
        return reply("❌ *Auto AI:* Disabled for this chat.");
    }
});

// Listener: Responds only to group members/users
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isBot }) => {
    // 1. Exit if AI is turned OFF for this specific chat
    if (!global.autoAiStatus || !global.autoAiStatus[from]) return;

    // 2. STOP INFINITE LOOP: Ignore if the message is from the bot itself or other bots
    if (m.key.fromMe || isBot) return;

    // 3. Ignore empty messages or commands (starting with . or /)
    if (!body || body.startsWith('.') || body.startsWith('/')) return;

    try {
        // Show "typing..." status for realism
        await conn.sendPresenceUpdate('composing', from);

        const apiUrl = `https://api.ryuu-dev.offc.my.id/ai/mahiru-ai?text=${encodeURIComponent(body)}`;
        const res = await axios.get(apiUrl, { timeout: 10000 });
        
        if (res.data && res.data.output) {
            const replyText = res.data.output.trim();
            
            // Artificial typing delay based on response length
            const delayTime = Math.min(4000, 1000 + replyText.length * 20);
            
            setTimeout(async () => {
                await conn.sendMessage(from, { text: replyText }, { quoted: mek });
            }, delayTime);
        }
    } catch (e) {
        console.error("AutoAI Error:", e.message);
    }
});
