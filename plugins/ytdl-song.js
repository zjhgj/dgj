const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
    pattern: "song",
    alias: ["ytplay", "music2", "audio"],
    react: "🎵",
    desc: "Download audio immediately from YouTube",
    category: "download",
    use: ".play <song name or link>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Please provide a song name or YouTube link.");

        // --- PHASE 1: GET VIDEO DATA ---
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return await reply("❌ **ERROR:** No results found.");

        const videoUrl = video.url;
        const title = video.title;
        const thumbnail = video.thumbnail;

        // Notify user that processing has started
        await reply(`📥 *Downloading:* ${title}...`);

        // --- PHASE 2: DOWNLOAD FROM API ---
        const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success || !data.result.download_url) {
            return await reply("❌ **ERROR:** Failed to fetch audio from server.");
        }

        // --- PHASE 3: SEND AUDIO ---
        await conn.sendMessage(from, {
            audio: { url: data.result.download_url },
            mimetype: 'audio/mpeg',
            ptt: false, // Set to true if you want it as a Voice Note
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD AUDIO PLAYER",
                    body: title,
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** ${error.message}`);
    }
});
