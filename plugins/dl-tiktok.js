const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "muslim-ai",
    alias: ["islamic-ai", "askmuslim"],
    react: "🕌",
    desc: "Ask questions related to Islam from Muslim AI (LID Fixed).",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        // --- TRUE LID FIX ---
        // Decode JID to handle LID groups and private chats correctly
        const targetChat = conn.decodeJid(from);

        if (!q) {
            return reply(`*Usage:* ${prefix}muslim-ai <question>\n*Example:* ${prefix}muslim-ai assalamualaikum`);
        }

        // Send reaction to decoded JID
        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });

        const res = await fetch(`https://api.ootaizumi.web.id/ai/muslim-ai?text=${encodeURIComponent(q)}`);
        const response = await res.json();

        if (!response?.message) {
            await conn.sendMessage(targetChat, { react: { text: "❌", key: m.key } });
            return reply("❌ Gomene, no response message from AI!");
        }

        // Send response to Decoded JID
        await conn.sendMessage(targetChat, { 
            text: response.message 
        }, { quoted: mek });

        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("Muslim AI Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ Gomene Error! Mungkin lu kebanyakan request atau API lagi down.");
    }
});
