// ✅ AI Image Editor for KAMRAN-MD
// 🛠️ API: ai-studio.anisaofc.my.id

const { cmd } = require('../command');
const axios = require('axios');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

cmd({
    pattern: "editi",
    alias: ["ai-edit", "modify"],
    desc: "AI Image Editing based on your prompt.",
    category: "ai",
    react: "🪄",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isGroup, sender }) => {
    try {
        // --- LID/JID Normalization ---
        const senderJid = jidNormalizedUser(sender);

        if (!q) {
            return await reply(`*🎨 AI IMAGE EDITOR*\n\nExample: Reply to an image with \`.edit change hair color to red\`\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`);
        }

        // Check if there is a quoted image or the message itself is an image
        let q_msg = m.quoted ? m.quoted : m;
        let mime = (q_msg.msg || q_msg).mimetype || "";

        if (!mime.startsWith("image/")) {
            return await reply(`✨ Please reply to an *image* that you want to edit.`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download the media
        let buffer = await q_msg.download();
        if (!buffer) {
            return await reply(`❌ Failed to download the image. Please try again.`);
        }

        // Convert buffer to Base64
        let imageBase64 = buffer.toString("base64");

        let payload = {
            image: imageBase64,
            prompt: q.trim()
        };

        // API Call using axios
        let response = await axios.post("https://ai-studio.anisaofc.my.id/api/edit-image", payload, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
                "Origin": "https://ai-studio.anisaofc.my.id",
                "Referer": "https://ai-studio.anisaofc.my.id/"
            }
        });

        const result = response.data;

        if (!result || !result.imageUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await reply(`🍂 Server did not return an edited image. Try a clearer prompt.`);
        }

        // Send the result
        await conn.sendMessage(from, {
            image: { url: result.imageUrl },
            caption: `✅ *Image Edited Successfully!*\n\n*Prompt:* ${q}\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`,
            contextInfo: {
                mentionedJid: [senderJid],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("AI Edit Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await reply(`❌ *Error:* ${error.message || "An unexpected error occurred."}`);
    }
});
