const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

// ================= MEDIA COMMANDS =================

// 1. URL Command (Media to Link)
cmd({
    pattern: "url",
    alias: ["tourl", "upload"],
    desc: "Upload media to get a public link.",
    category: "tools",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // Check if media is quoted
        if (!quoted) return reply("❌ Please reply to a photo or video!");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download media using the bot's internal downloader
        const buffer = await m.download();
        
        let form = new FormData();
        form.append("file", buffer, { filename: "file" });

        // API Upload
        let res = await axios.post(
            "https://files.lordobitotech.xyz/api/mediafiles",
            form,
            {
                headers: {
                    ...form.getHeaders()
                }
            }
        );

        if (!res.data.success) return reply("❌ Upload failed at server.");

        const link = res.data.url;
        const MY_CHANNEL = "120363424268743982@newsletter"; // Your Channel JID

        await conn.sendMessage(from, {
            text: `╭━〔 🔗 𝗨𝗣𝗟𝗢𝗔𝗗𝗘𝗗 〕━╮
┃ ✅ Upload successful
┃ 🆔 ID : ${res.data.id}
┃ 🌐 Link :
┃ ${link}
╰━━━━━━━━━━━╯`,
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
        console.error(err?.response?.data || err);
        reply("❌ API upload error: " + (err.message || "Unknown error"));
    }
});

// 2. Save Command (Get media as document)
cmd({
    pattern: "save",
    alias: ["get", "download"],
    desc: "Download and save status/media as a document.",
    category: "tools",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, reply, quoted }) => {
    try {
        if (!quoted) return reply("❌ Please reply to a status or any media!");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download media
        const buffer = await m.download();

        // Sending as a document file
        await conn.sendMessage(from, {
            document: buffer,
            mimetype: quoted.mimetype || 'application/octet-stream',
            fileName: `Saved_By_KamranMD_${Date.now()}`,
            caption: "> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Failed to save media.");
    }
});
