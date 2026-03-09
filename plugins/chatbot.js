const { cmd } = require('../command');
const axios = require('axios');

// Status memory
if (!global.autoAiStatus) global.autoAiStatus = {}; 

cmd({
    pattern: "autoai",
    desc: "Enable/Disable Auto AI in groups.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    if (!isAdmins && !isOwner) return reply("❌ Admins only.");
    if (!q) return reply("❓ Use: *.autoai on* or *.autoai off*");

    if (q.toLowerCase() === 'on') {
        global.autoAiStatus[from] = true;
        return reply("✅ *Auto AI:* Enabled. Ab bot sirf users ko jawab dega.");
    } else if (q.toLowerCase() === 'off') {
        global.autoAiStatus[from] = false;
        return reply("❌ *Auto AI:* Disabled.");
    }
});

// Listener: Fixed to ignore self-messages
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isBot }) => {
    // 1. Agar AI off hai toh ruk jao
    if (!global.autoAiStatus || !global.autoAiStatus[from]) return;

    // 2. STOP LOOP: Agar message bot ne khud bheja hai (fromMe), toh ignore karo
    if (m.key.fromMe || isBot) return;

    // 3. Khali message ya command ignore karo
    if (!body || body.startsWith('.') || body.startsWith('/')) return;

    try {
        await conn.sendPresenceUpdate('composing', from);

        const apiUrl = `https://api.ryuu-dev.offc.my.id/ai/mahiru-ai?text=${encodeURIComponent(body)}`;
        const res = await axios.get(apiUrl, { timeout: 10000 });
        
        if (res.data && res.data.output) {
            const replyText = res.data.output.trim();
            
            // Real delay simulation
            const delayTime = Math.min(4000, 1000 + replyText.length * 20);
            
            setTimeout(async () => {
                await conn.sendMessage(from, { text: replyText }, { quoted: mek });
            }, delayTime);
        }
    } catch (e) {
        console.error("AutoAI Loop Fix Error:", e.message);
    }
});
