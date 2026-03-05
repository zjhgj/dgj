const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search");

cmd({
    pattern: "song",
    alias: ["play", "audio", "ytmp3"],
    desc: "Download YouTube audio by Name or URL",
    category: "download",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a YouTube link or Song Name.");

        let cleanUrl = q;

        // Search logic if input is not a URL
        if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
            await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
            const search = await yts(q);
            const video = search.videos[0];
            if (!video) return reply("❌ No results found.");
            cleanUrl = video.url;
        } else {
            cleanUrl = q.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");
        }

        // Fetching from API
        const res = await axios.get(`https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(cleanUrl)}`);
        if (!res.data?.result?.status) return reply("❌ Failed to fetch audio.");

        const { metadata: meta, download } = res.data.result;

        // Send Details
        await conn.sendMessage(from, {
            image: { url: meta.thumbnail },
            caption: `🎶 *${meta.title}*\n\n👤 *Channel:* ${meta.author}\n💽 *Quality:* MP3\n\n> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀᴏᴠᴀ-ᴍᴅ🤍*`
        }, { quoted: mek });

        // Send Audio
        await conn.sendMessage(from, {
            audio: { url: download.url },
            mimetype: "audio/mpeg",
            fileName: `${meta.title}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ An error occurred.");
    }
});
            
