const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Enhanced AmoyShare Helper
 */
const amoyshare = {
    generateHeader: () => {
        const date = new Date();
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1;
        let dd = date.getDate();

        mm = mm > 9 ? mm : "0" + mm;
        dd = dd > 9 ? dd : "0" + dd;

        const dateStr = `${yyyy}${mm}${dd}`;
        const constant = "786638952";
        const randomVal = 1000 + Math.round(8999 * Math.random());
        const key = `${dateStr}${constant}${randomVal}`;
        const hashInput = `${dateStr}${randomVal}${constant}`;
        
        const signature = crypto.createHash('md5')
            .update(hashInput)
            .digest('hex');

        return `${key}-${signature}`;
    },

    request: async (url, params = {}) => {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Referer': 'https://www.amoyshare.com/',
            'Origin': 'https://www.amoyshare.com',
            'amoyshare': amoyshare.generateHeader()
        };

        const response = await axios.get(url, { params, headers, timeout: 15000 });
        return response.data;
    }
};

cmd({
    pattern: "dl",
    alias: ["alldl", "get"],
    desc: "Download videos from TikTok, FB, IG, YT etc.",
    category: "download",
    use: ".dl <link>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`📥 *Usage:* \`${prefix + command} <link>\``);

        // Basic URL Validation
        if (!q.startsWith("http")) return reply("❌ Please provide a valid URL starting with http/https.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const waitMsg = await reply("🔄 *Processing your request...*");

        const apiUrl = 'https://line.1010diy.com/web/free-mp3-finder/urlParse';
        const result = await amoyshare.request(apiUrl, { url: q, phonydata: 'false' });

        // Debugging & Validation
        if (!result || result.code !== 200 || !result.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Server Busy:* Could not parse this URL. Please try again later or check the link.");
        }

        const videoData = result.data;
        let downloadUrl = "";
        let title = videoData.title || "Video Download";

        // Strategy 1: Look in 'list' array (Most common)
        if (videoData.list && videoData.list.length > 0) {
            // Prefer MP4 and check for valid URLs
            const videoItem = videoData.list.find(item => item.format === "mp4" && item.url) || 
                              videoData.list.find(item => item.url);
            if (videoItem) downloadUrl = videoItem.url;
        }

        // Strategy 2: Look in 'links' or direct 'url' (Fallback)
        if (!downloadUrl && videoData.url) {
            downloadUrl = videoData.url;
        }

        if (!downloadUrl) {
            return reply("❌ No downloadable video found for this link. It might be a private or restricted video.");
        }

        const caption = `🎬 *KAMRAN-MD DOWNLOADER*\n\n📌 *Title:* ${title}\n🌐 *Source:* ${videoData.source || 'Online'}\n\n*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: caption,
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Download Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "An unexpected error occurred."}`);
    }
});
