//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE VIDEO DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD VIDEOS DIRECTLY FROM YOUTUBE USING JAWAD-TECH API
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "video2",
    alias: ["ytdl", "ytmp4", "playvideo"],
    desc: "Download videos from YouTube.",
    category: "download",
    use: ".video perfect ed sheeran",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        if (!text) return reply(`🎥 *YouTube Video Downloader*\n\nUsage: \`${prefix + command} <song name or link>\`\nExample: \`${prefix + command} memories maroon 5\``);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Step 1: Search or use URL to get download data
        // Note: The API requires a direct YouTube URL. 
        // If the user provides text, we use a search hint (if the API supports it) or prompt for URL.
        let url = text;
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return reply("❌ Please provide a valid YouTube Video Link.\nExample: `.video https://www.youtube.com/watch?v=xxx` ");
        }

        reply(`_📥 Downloading video, please wait..._`);

        // Step 2: Fetch data from Jawad-Tech API
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch video. Please make sure the link is correct.");
        }

        const video = data.result;

        // Step 3: Send Video File
        await conn.sendMessage(from, {
            video: { url: video.download_url },
            caption: `🎥 *YT VIDEO DOWNLOADER*\n\n📝 *Title:* ${video.title}\n📺 *Quality:* 360p/720p\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Video Download Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Something went wrong while downloading."}`);
    }
});
