const { cmd } = require('../command');
const yts = require("yt-search");
const axios = require("axios");

cmd({
    pattern: "song",
    alias: ["ytmp3", "play"],
    react: "🎶",
    desc: "Fast YouTube MP3 with Backup Servers",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`❌ *Usage:* \n${prefix}play <song name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Step 1: Search Video
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found!");
        const video = search.videos[0];
        const url = video.url;

        let downloadUrl = null;
        let title = video.title;

        // Step 2: Try Primary Server (Arslan API)
        try {
            const res = await axios.get(`https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            if (res.data?.result?.download?.url) {
                downloadUrl = res.data.result.download.url;
                title = res.data.result.metadata?.title || title;
            }
        } catch (e) {
            console.log("Arslan API Timeout, switching to Backup...");
        }

        // Step 3: Try Backup Server if primary fails
        if (!downloadUrl) {
            try {
                const res2 = await axios.get(`https://api.dreaded.site/api/ytdl/video?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                if (res2.data?.result?.download_url) {
                    downloadUrl = res2.data.result.download_url;
                }
            } catch (e) {
                return reply("❌ All servers are busy. Please try again in a moment.");
            }
        }

        // Step 4: Send Final Response
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title.substring(0, 45),
                    body: "KAMRAN-MD FAST DOWNLOAD",
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: url,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: false // Fast loading ke liye false rakha hai
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        reply("❌ An unexpected error occurred.");
    }
});
