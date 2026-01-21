const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

/**
 * Handle Reply logic for MP3 selection
 */
async function handleMediaReply(conn, messageID, from, video, downloadUrl, mek) {
    conn.ev.on("messages.upsert", async (msgData) => {
        try {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const text = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReply = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            if (!isReply) return;

            await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

            switch (text.trim()) {
                case "1": // MP3 Audio
                    await conn.sendMessage(senderID, { 
                        audio: { url: downloadUrl }, 
                        mimetype: "audio/mpeg", 
                        ptt: false 
                    }, { quoted: receivedMsg });
                    break;
                case "2": // MP3 Document
                    await conn.sendMessage(senderID, { 
                        document: { url: downloadUrl }, 
                        fileName: `${video.title}.mp3`, 
                        mimetype: "audio/mpeg" 
                    }, { quoted: receivedMsg });
                    break;
                case "3": // ✅ FIXED VOICE NOTE (PTT)
                    await conn.sendMessage(senderID, { 
                        audio: { url: downloadUrl }, 
                        mimetype: 'audio/ogg; codecs=opus', // Ye line playback theek karegi
                        ptt: true 
                    }, { quoted: receivedMsg });
                    break;
                default:
                    await conn.sendMessage(senderID, { text: "❌ Invalid choice!" }, { quoted: receivedMsg });
            }
            await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
        } catch (err) {
            console.error(err);
        }
    });
}

// ================== YTMP3 DOWNLOADER ==================
cmd({
    pattern: "song",
    alias: ["audio", "ytmp3"],
    react: "🎵",
    desc: "Download YouTube MP3 via Koyeb API",
    category: "download",
    use: ".song <name or link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Provide a song name or YouTube link!");

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");
        const video = search.videos[0];

        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(video.url)}`;
        const { data: apiRes } = await axios.get(apiUrl);

        if (!apiRes?.status || !apiRes.data?.url) {
            return reply("❌ API Error!");
        }

        const dlUrl = apiRes.data.url;

        const caption = `
📑 *Title:* ${video.title}
⏱ *Duration:* ${video.timestamp}
🔗 *Link:* ${video.url}

🔢 *Reply with:*
1️⃣ Audio (MP3)
2️⃣ Document (File)
3️⃣ Voice Note (PTT)

> KAMRAN-MD ❤️`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: video.thumbnail }, 
            caption: caption 
        }, { quoted: mek });

        handleMediaReply(conn, sentMsg.key.id, from, video, dlUrl, mek);

    } catch (e) {
        console.error(e);
        reply("❌ Error occurred!");
    }
});
            
