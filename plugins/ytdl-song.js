const { cmd } = require('../command');
const fetch = require('node-fetch');
const yts = require('yt-search');
const axios = require('axios');

async function handleReply(conn, messageID, from, videos, apiResult, mek) {
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
                case "1":
                    await conn.sendMessage(senderID, { audio: { url: apiResult.url }, mimetype: "audio/mpeg", ptt: false }, { quoted: receivedMsg });
                    break;
                case "2":
                    await conn.sendMessage(senderID, { document: { url: apiResult.url, fileName: `${videos.title}.mp3`, mimetype: "audio/mpeg" }, caption: videos.title }, { quoted: receivedMsg });
                    break;
                case "3":
                    await conn.sendMessage(senderID, { audio: { url: apiResult.url }, mimetype: "audio/mpeg", ptt: true }, { quoted: receivedMsg });
                    break;
                default:
                    await conn.sendMessage(senderID, { text: "❌ Invalid choice! Reply with 1, 2, or 3." }, { quoted: receivedMsg });
            }
        } catch (err) {
            console.error(err);
        }
    });
}

// ================== SONG4 (Koyeb API) ==================
cmd({
    pattern: "song",
    react: "🎵",
    desc: "Download YouTube MP3 via Koyeb API",
    category: "download",
    use: ".song4 <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Provide a song name or YouTube link!");

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");

        const video = search.videos[0];
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(video.url)}`;
        const { data: apiRes } = await axios.get(apiUrl);
        if (!apiRes?.status || !apiRes.data?.url) return reply("❌ Unable to download song!");

        const caption = `
📑 *Title:* ${video.title}
⏱ *Duration:* ${video.timestamp}
📆 *Uploaded:* ${video.ago}
📊 *Views:* ${video.views}
🔗 *Link:* ${video.url}

🔢 Reply:
1️⃣ Audio
2️⃣ Document
3️⃣ Voice Note

> KAMRAN-MD ❤️`;

        const sentMsg = await conn.sendMessage(from, { image: { url: video.thumbnail }, caption }, { quoted: mek });
        handleReply(conn, sentMsg.key.id, from, video, apiRes.data, mek);

    } catch (e) {
        console.error("Song4 Error:", e);
        reply("❌ Error occurred while processing request.");
    }
});

// ================== PLAY (Nekolabs API) ==================
cmd({
    pattern: "play4",
    react: "🎵",
    desc: "Download YouTube song via Nekolabs API",
    category: "download",
    use: ".play <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ Provide a song name or YouTube link!");

        const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(q)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (!data?.success || !data?.result?.downloadUrl) return reply("❌ Song not found or API error!");

        const meta = data.result.metadata;
        const dlUrl = data.result.downloadUrl;

        const caption = `
📑 *Title:* ${meta.title}
⏱ *Duration:* ${meta.duration}
📡 *Channel:* ${meta.channel}
🔗 *Link:* ${meta.url}

🔢 Reply:
1️⃣ Audio
2️⃣ Document
3️⃣ Voice Note

> KAMRAN-MD ❤️`;

        const sentMsg = await conn.sendMessage(from, { image: { url: meta.cover }, caption }, { quoted: mek });
        handleReply(conn, sentMsg.key.id, from, meta, { url: dlUrl }, mek);

    } catch (e) {
        console.error("Play Error:", e);
        reply("❌ Error occurred while processing request.");
    }
});
                                                                                                    
