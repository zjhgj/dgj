const { cmd } = require('../command');
const axios = require('axios');

/**
 * Handle Reply for Instagram Selection
 */
async function handleIgReply(conn, messageID, from, mediaData, mek) {
    conn.ev.on("messages.upsert", async (msgData) => {
        try {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const text = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReply = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            if (!isReply) return;

            await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

            // Media URL (Array ka pehla item default pick kar rahe hain selection ke liye)
            const downloadUrl = mediaData[0].url;
            const isVideo = mediaData[0].wm === false; // Usually indicates a video in this API structure

            switch (text.trim()) {
                case "1": // Video/Photo Download
                    if (isVideo) {
                        await conn.sendMessage(senderID, { video: { url: downloadUrl }, caption: "✅ *Downloaded by WHITESHADOW-MD*" }, { quoted: receivedMsg });
                    } else {
                        await conn.sendMessage(senderID, { image: { url: downloadUrl }, caption: "✅ *Downloaded by WHITESHADOW-MD*" }, { quoted: receivedMsg });
                    }
                    break;
                case "2": // Audio MP3
                    await conn.sendMessage(senderID, { audio: { url: downloadUrl }, mimetype: "audio/mpeg", ptt: false }, { quoted: receivedMsg });
                    break;
                case "3": // Document File
                    await conn.sendMessage(senderID, { document: { url: downloadUrl }, fileName: `Instagram_Media.mp4`, mimetype: "video/mp4" }, { quoted: receivedMsg });
                    break;
                default:
                    await conn.sendMessage(senderID, { text: "❌ Invalid choice! Reply with 1, 2, or 3." }, { quoted: receivedMsg });
            }
            
            await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
        } catch (err) {
            console.error("Reply Error:", err);
        }
    });
}

// ================== INSTAGRAM DOWNLOADER ==================
cmd({
    pattern: "igdl",
    alias: ["ig", "insta"],
    react: "📸",
    desc: "Download Instagram Media via Koyeb API",
    category: "download",
    use: ".igdl <link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Provide an Instagram link!");

        // API URL from your request
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(q.trim())}`;
        
        const { data: apiRes } = await axios.get(apiUrl);
        
        if (!apiRes?.status || !apiRes.data || apiRes.data.length === 0) {
            return reply("❌ Media not found or API error! Make sure the account is public.");
        }

        const media = apiRes.data; // Array of media links
        const firstMedia = media[0].url;

        const caption = `
📸 *INSTAGRAM DOWNLOADER* 📸

📂 *Total Files:* ${media.length}
🔗 *Link:* ${q}

🔢 *Reply with:*
1️⃣ Video/Photo
2️⃣ Audio (MP3)
3️⃣ Document (File)

> WHITESHADOW-MD ❤️`;

        // Send Preview Image with Selection Menu
        const sentMsg = await conn.sendMessage(from, { 
            image: { url: firstMedia }, 
            caption: caption 
        }, { quoted: mek });

        // Handle the reply selection
        handleIgReply(conn, sentMsg.key.id, from, media, mek);

    } catch (e) {
        console.error("IGDL Error:", e);
        reply("❌ Error occurred while processing Instagram request.");
    }
});
                                           
