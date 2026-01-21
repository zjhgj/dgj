const { cmd } = require('../command');
const fetch = require('node-fetch');
const yts = require('yt-search');
const axios = require('axios');

/**
 * Handle Reply for Video and Audio Selection
 */
async function handleVideoAudioReply(conn, messageID, from, videoInfo, apiResult, mek) {
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
                case "1": // Video File
                    await conn.sendMessage(senderID, { 
                        video: { url: apiResult.video_url }, 
                        caption: `✅ *${videoInfo.title}*\n\n> Powered by KAMRAN-MD`,
                        mimetype: "video/mp4" 
                    }, { quoted: receivedMsg });
                    break;
                case "2": // Audio File
                    await conn.sendMessage(senderID, { 
                        audio: { url: apiResult.audio_url }, 
                        mimetype: "audio/mpeg", 
                        ptt: false 
                    }, { quoted: receivedMsg });
                    break;
                case "3": // Document Video
                    await conn.sendMessage(senderID, { 
                        document: { url: apiResult.video_url, fileName: `${videoInfo.title}.mp4`, mimetype: "video/mp4" }, 
                        caption: videoInfo.title 
                    }, { quoted: receivedMsg });
                    break;
                default:
                    await conn.sendMessage(senderID, { text: "❌ Invalid choice! Reply with 1, 2, or 3." }, { quoted: receivedMsg });
            }
            await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
        } catch (err) {
            console.error(err);
        }
    });
}

// ================== YTDL (Video & Audio) ==================
cmd({
    pattern: "song2",
    alias: ["song", "play3", "play2"],
    react: "🎥",
    desc: "Download YouTube Video or Audio",
    category: "download",
    use: ".ytdl <name/link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide a link or search term!");

        // Step 1: Search for Video
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");
        const video = search.videos[0];

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Step 2: Fetch Links (Using Jawad-Tech API as per your earlier snippets)
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(video.url)}`;
        const { data: apiRes } = await axios.get(apiUrl);

        if (!apiRes.status) return reply("❌ Unable to fetch download links!");

        const downloadData = {
            video_url: apiRes.result.mp4,
            audio_url: apiRes.result.mp3 || apiRes.result.mp4 // Fallback to mp4 if mp3 missing
        };

        const caption = `
🎥 *YT DOWNLOADER* 🎥

📑 *Title:* ${video.title}
⏱ *Duration:* ${video.timestamp}
📡 *Views:* ${video.views.toLocaleString()}
🔗 *Link:* ${video.url}

*Inmein se select karein:*
1️⃣ *Video (MP4)*
2️⃣ *Audio (MP3)*
3️⃣ *Video (Document)*

> KAMRAN-MD ❤️`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: video.thumbnail }, 
            caption: caption 
        }, { quoted: mek });

        // Step 3: Handle Selection
        handleVideoAudioReply(conn, sentMsg.key.id, from, video, downloadData, mek);

    } catch (e) {
        console.error(e);
        reply("❌ Error occurred while processing request.");
    }
});
                                           
