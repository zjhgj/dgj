const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "nanobanana2",
    alias: ["editai2"],
    category: "ai",
    react: "🪄",
    desc: "AI Image Editor with Better Detection"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    try {
        // --- 1. Strong Detection of Image ---
        let quoted = m.quoted ? m.quoted : m;
        let mime = (quoted.msg || quoted).mimetype || '';
        
        if (!mime.includes('image')) {
            await react("❓");
            return reply("Bhai, image ko reply karke command likhein!");
        }

        if (!q) return reply("Bhai, prompt dein! Example: .nanobanana2 change name to KAMRAN");

        await react("⏳");

        // --- 2. Reliable Download Logic ---
        let downloadMime = m.quoted ? m.msg.contextInfo.quotedMessage.imageMessage : m.msg.imageMessage;
        let stream = await downloadContentFromMessage(downloadMime, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // --- 3. Send to AI API ---
        const result = await nanobanana(q, buffer); // Puraana nanobanana function yahan use hoga

        if (result && result.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: result[0] }, 
                caption: `✅ *AI Edit Successful*\n✨ *Prompt:* ${q}\n\n> *${botFooter}*` 
            }, { quoted: mek });
            await react("✅");
        } else {
            reply("❌ AI ne image process nahi ki. Dobara try karein.");
        }

    } catch (e) {
        console.error(e);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
