const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

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

                case "2": // Document
                    await conn.sendMessage(senderID, { 
                        document: { url: downloadUrl }, 
                        fileName: `${video.title}.mp3`, 
                        mimetype: "audio/mpeg" 
                    }, { quoted: receivedMsg });
                    break;

                case "3": // ✅ FIXED VOICE NOTE (PTT)
                    await conn.sendMessage(senderID, { 
                        audio: { url: downloadUrl }, 
                        mimetype: 'audio/ogg; codecs=opus', // Codec change for playback fix
                        ptt: true 
                    }, { quoted: receivedMsg });
                    break;
            }
            await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
        } catch (err) { console.error(err); }
    });
}

cmd({
    pattern: "play3",
    alias: ["song3", "music2"],
    react: "🎶",
    desc: "YouTube Music Downloader",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide a song name!");

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");
        const video = search.videos[0];

        // Movanest API Fetch
        const apiUrl = `https://www.movanest.xyz/v2/ytmp3?url=${encodeURIComponent(video.url)}`;
        const { data: apiRes } = await axios.get(apiUrl);

        // ✅ API PATH FIXED (Screenshot 4 ke mutabik)
        const dlUrl = apiRes.result?.downloadUrl;

        if (!dlUrl) return reply("❌ API could not generate a link. Try again later.");

        const menuText = `
🎵 *WHITESHADOW-MD PLAYER*

📌 *Title:* ${video.title}
⏱ *Duration:* ${video.timestamp}

🔢 *Reply with:*
1️⃣ *Audio (MP3)*
2️⃣ *Document (File)*
3️⃣ *Voice Note (PTT)* ✅

> © KAMRAN-MD ❤️`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: video.thumbnail }, 
            caption: menuText 
        }, { quoted: mek });

        handlePlayReply(conn, sentMsg.key.id, from, video, dlUrl, mek);

    } catch (e) {
        console.error(e);
        reply("❌ Error occurred while processing your request.");
    }
});
                            
