const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ================= MEDIA COMMANDS =================

cmd({
    pattern: "url",
    alias: ["tourl", "upload"],
    desc: "Upload media to get a public link.",
    category: "tools",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // Find if there's any media (Direct or Quoted)
        const isQuotedImage = m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.msg?.mimetype?.includes('image'));
        const isQuotedVideo = m.quoted && (m.quoted.type === 'videoMessage' || m.quoted.msg?.mimetype?.includes('video'));
        const isDirectMedia = m.type === 'imageMessage' || m.type === 'videoMessage';

        if (!isDirectMedia && !isQuotedImage && !isQuotedVideo) {
            return reply("❌ Please reply to a photo or video!");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download logic that handles serialized messages properly
        const buffer = await m.download(); // Using the built-in downloader from your framework
        
        if (!buffer) return reply("❌ Failed to download media buffer.");

        let form = new FormData();
        form.append("file", buffer, { filename: "file" });

        // API Upload
        let res = await axios.post(
            "https://files.lordobitotech.xyz/api/mediafiles",
            form,
            {
                headers: { ...form.getHeaders() }
            }
        );

        if (!res.data.success) return reply("❌ Upload failed at server.");

        const link = res.data.url;
        const MY_CHANNEL = "120363424268743982@newsletter";

        await conn.sendMessage(from, {
            text: `╭━〔 🔗 𝗨𝗣𝗟𝗢𝗔𝗗𝗘𝗗 〕━╮\n┃ ✅ Upload successful\n┃ 🆔 ID : ${res.data.id}\n┃ 🌐 Link :\n┃ ${link}\n╰━━━━━━━━━━━╯`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: MY_CHANNEL,
                    newsletterName: "KAMRAN-MD",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + (err.message || "Process failed"));
    }
});

// Save Command logic remains similar but with robust download
cmd({
    pattern: "save",
    alias: ["get"],
    desc: "Save status/media as document.",
    category: "tools",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        if (!m.quoted) return reply("❌ Please reply to a media file!");
        
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const buffer = await m.download();
        if (!buffer) return reply("❌ Failed to download.");

        await conn.sendMessage(from, {
            document: buffer,
            mimetype: m.quoted.mimetype || 'application/octet-stream',
            fileName: `Saved_By_KamranMD`,
            caption: "> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});
