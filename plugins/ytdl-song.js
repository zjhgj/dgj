const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "song",
    alias: ["play2", "music"],
    react: "🎵",
    desc: "Download audio from YouTube using Workers API.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube link!\n\nExample: .song starboy");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Search YouTube
        const search = await yts(q);
        if (!search || !search.videos.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("⚠️ No results found for your query!");
        }

        const video = search.videos[0];
        const videoUrl = video.url;

        // Send video info
        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: `*🎵 KAMRAN-MD SONG DOWNLOADER*\n\n*📌 Title:* ${video.title}\n*⏱ Duration:* ${video.timestamp}\n*👁 Views:* ${video.views.toLocaleString()}\n\n_📥 Downloading audio, please wait..._`
        }, { quoted: mek });

        // Call the Workers API
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("🚫 API Error: Failed to fetch audio. Please try again later.");
        }

        const audioUrl = data.audio;
        const title = data.title || video.title;

        if (!audioUrl) {
            return reply("🚫 No audio URL found in response.");
        }

        // Send the audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Song Command Error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ Download failed. System error: " + error.message);
    }
});
