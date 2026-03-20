const { cmd } = require('../command');
const axios = require('axios');

let autoDlStatus = true; 

// Behtar Regex jo handle karega sab platforms
const anyVideoRegex = /https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|instagram\.com|facebook\.com|fb\.watch|youtube\.com|youtu\.be|reels)\/[^\s]+/i;

/**
 * Enhanced Downloader Logic
 */
async function downloadMedia(url) {
    try {
        // Primary API: Jawad-Tech
        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        
        // TikTok aur YouTube ke liye data extract karne ka sahi tareeqa
        let res = response.data;
        let result = res.result || res.data || res;

        // Agar array hai (aksar TikTok/YT mein hota hai), pehla valid link uthayen
        if (Array.isArray(result)) return result[0];
        return result;
    } catch (error) {
        console.log("Primary API Error, switching to fallback...");
        // Fallback: Gifted API (Jo YT/TikTok ke liye zyada stable hai)
        const fallback = await axios.get(`https://api.giftedtech.my.id/api/download/all?url=${encodeURIComponent(url)}`);
        return fallback.data.result;
    }
}

/**
 * Smart Result Sender
 */
async function sendResult(conn, m, from, media) {
    // Media se direct URL nikalne ki koshish
    let downloadUrl = "";
    
    if (typeof media === 'string') {
        downloadUrl = media;
    } else if (media) {
        // Platforms like TikTok/YT often use these keys
        downloadUrl = media.video || media.hd || media.url || media.downloadUrl || media.link || (media.mp4 ? media.mp4 : null);
    }

    if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error("No downloadable link found");
    }

    // WhatsApp par video ya image bhejna
    const isVideo = downloadUrl.includes(".mp4") || downloadUrl.includes("googlevideo") || downloadUrl.includes("video") || downloadUrl.includes("fbcdn");

    if (isVideo) {
        await conn.sendMessage(from, { 
            video: { url: downloadUrl }, 
            caption: "✅ *Downloaded Successfully*",
            mimetype: 'video/mp4'
        }, { quoted: m });
    } else {
        await conn.sendMessage(from, { 
            image: { url: downloadUrl },
            caption: "✅ *Media Downloaded*"
        }, { quoted: m });
    }
}

// --- COMMANDS --- (Same as your previous logic)
cmd({
    pattern: "dl",
    alias: ["download"],
    desc: "Download video.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("❓ Please provide a link.");
    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    
    try {
        const media = await downloadMedia(q);
        await sendResult(conn, m, from, media);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        reply("❌ Download failed. Link expired ho sakta hai ya API down hai.");
    }
});

// Auto-DL logic ko export karein
async function handleAutoDL(conn, m) {
    if (!autoDlStatus || !m.text || m.key.fromMe) return;
    const match = m.text.match(anyVideoRegex);
    if (match) {
        const url = match[0];
        const from = m.chat;
        try {
            await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
            const media = await downloadMedia(url);
            await sendResult(conn, m, from, media);
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        } catch (e) {
            console.log("Auto-DL Error:", e.message);
        }
    }
}

module.exports = { handleAutoDL };
