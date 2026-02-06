const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

/**
 * Handle Media Selection Logic
 */
async function handlePlayReply(conn, messageID, from, video, downloadUrl, mek) {
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

                case "2": // Document File
                    await conn.sendMessage(senderID, { 
                        document: { url: downloadUrl }, 
                        fileName: `${video.title}.mp3`, 
                        mimetype: "audio/mpeg" 
                    }, { quoted: receivedMsg });
                    break;

                case "3": // ✅ FIXED: Voice Note (PTT)
                    await conn.sendMessage(senderID, { 
                        audio: { url: downloadUrl }, 
                        mimetype: 'audio/ogg; codecs=opus', // Voice note player fix
                        ptt: true 
                    }, { quoted: receivedMsg });
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

// ================== PLAY COMMAND ==================
cmd({
    pattern: "play3",
    alias: ["song2", "music4"],
    react: "🎶",
    desc: "Search and download audio from YouTube",
    category: "download",
    use: ".play <song name>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube link!");

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Step 1: Search YouTube
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");
        const video = search.videos[0];

        // Step 2: Call your new Movanest API
        const apiUrl = `https://www.movanest.xyz/v2/ytmp3?url=${encodeURIComponent(video.url)}`;
        const { data: apiRes } = await axios.get(apiUrl);

        // Check if API response has the download link
        // Note: I'm assuming the API returns { status: true, result: { download_url: '...' } } 
        // Based on common API structures. Adjust property names if different.
        const dlUrl = apiRes.result || apiRes.download_url || apiRes.url;

        if (!dlUrl) return reply("❌ API failed to generate a download link!");

        const menuText = `
🎵 *WHITESHADOW-MD PLAYER* 🎵

📝 *Title:* ${video.title}
🕒 *Duration:* ${video.timestamp}
📅 *Uploaded:* ${video.ago}
👁‍🗨 *Views:* ${video.views.toLocaleString()}

🔢 *Reply with:*
1️⃣ *Audio (MP3)*
2️⃣ *Document (File)*
3️⃣ *Voice Note (PTT)* ✅

> Powered by Movanest API ❤️`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: video.thumbnail }, 
            caption: menuText 
        }, { quoted: mek });

        // Step 3: Handle the user's reply
        handlePlayReply(conn, sentMsg.key.id, from, video, dlUrl, mek);

    } catch (e) {
        console.error("Play Error:", e);
        reply("❌ An error occurred while processing your request.");
    }
});
          
