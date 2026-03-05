const { cmd } = require("../command");
const axios = require("axios");

// API Configuration
const API_KEY = "b354f2bfca2f92fd4575d1b7ed0ce56c341a4da22674c55a34a13ced483c3f98"; 
const API_BASE_URL = "https://back.asitha.top/api/ytapi";

cmd({
    pattern: "yt",
    alias: ["ytdl", "downloadyt"],
    react: "📥",
    desc: "Download YouTube Video or Audio using Asitha API.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        // Step 1: Input Validation
        if (!q) return reply(`❓ *Example:* ${prefix + command} https://www.youtube.com/watch?v=xxxx`);

        // Check if URL is valid YouTube link
        if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
            return reply("❌ Please provide a valid YouTube URL.");
        }

        // Step 2: Reaction & Status Update
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        reply("🚀 *KAMRAN-MD:* Fetching media from Asitha Server...");

        // Step 3: API Request (Using Method 1: Auth Header)
        const response = await axios.get(API_BASE_URL, {
            params: {
                url: q,
                fo: "1", // Format (often used for mp4/mp3 selection)
                qu: "360" // Quality (144, 360, 720)
            },
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const data = response.data;

        // Step 4: Validation of Data
        if (!data || !data.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ *API Error:* Failed to get download links. Server might be busy.");
        }

        // Step 5: Sending Media
        const videoUrl = data.result.downloadUrl || data.result.url;
        const title = data.result.title || "YouTube Media";
        const thumbnail = data.result.thumbnail;

        let caption = `🎥 *KAMRAN-MD YT DOWNLOADER*\n\n`;
        caption += `📌 *Title:* ${title}\n`;
        caption += `🔗 *Source:* YouTube\n\n`;
        caption += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;

        // Sending Video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: caption
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("YT Download Error:", e.response?.data || e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`⚠️ *KAMRAN-MD Error:* ${e.response?.data?.message || "Connection timeout."}`);
    }
});
    
