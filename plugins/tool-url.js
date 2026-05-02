const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

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
        // Check if the message or the quoted message is media
        const isMedia = m.type === 'imageMessage' || m.type === 'videoMessage' || 
                        (quoted && (quoted.type === 'imageMessage' || quoted.type === 'videoMessage'));
        
        if (!isMedia) return reply("❌ Please reply to a photo or video!");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Correct way to download media from quoted or direct message
        const messageToDownload = quoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message;
        
        // Handling image/video separately for correct download
        const messageType = quoted ? m.quoted.type : m.type;
        const msgKey = messageType === 'imageMessage' ? 'image' : 'video';

        const buffer = await downloadMediaMessage(
            { message: messageToDownload },
            'buffer',
            {},
            { 
                logger: console,
                reuploadRequest: conn.updateMediaMessage
            }
        );
        
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
        reply("❌ Error: " + (err.message || "Failed to download media"));
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

        const messageToDownload = quoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message;

        const buffer = await downloadMediaMessage(
            { message: messageToDownload },
            'buffer',
            {},
            { logger: console, reuploadRequest: conn.updateMediaMessage }
        );

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
