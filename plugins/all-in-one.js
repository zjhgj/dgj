const { cmd } = require('../command');
const axios = require('axios');

// --- DATABASE SIMULATION ---
// Note: Real world scenarios use JSON or MongoDB. For now, we use a simple variable.
let autoDlStatus = true; 

// Regex to detect various links
const anyVideoRegex = /https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|instagram\.com|facebook\.com|fb\.watch|youtube\.com|youtu\.be)\/[^\s]+/i;

/**
 * Main Downloader Logic
 * You can also trigger this manually via .dl <link>
 */
async function downloadMedia(url) {
    // Using a reliable multi-downloader API
    const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    let media = response.data.result || response.data.data || response.data;
    
    if (!media || (Array.isArray(media) && media.length === 0)) {
        // Fallback to Gifted API if Jawad-Tech fails
        const fallback = await axios.get(`https://api.giftedtech.my.id/api/download/all?url=${url}`);
        return fallback.data.result;
    }
    return media;
}

// --- COMMAND: AUTO DL TOGGLE ---
cmd({
    pattern: "autodl",
    desc: "Turn Auto Downloader On or Off.",
    category: "config",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    if (!q) return reply(`🤖 *Current Status:* ${autoDlStatus ? "ON ✅" : "OFF ❌"}\n\nUse: *.autodl on* or *.autodl off*`);
    
    if (q.toLowerCase() === "on") {
        autoDlStatus = true;
        reply("✅ *Auto Downloader has been enabled.*");
    } else if (q.toLowerCase() === "off") {
        autoDlStatus = false;
        reply("❌ *Auto Downloader has been disabled.*");
    } else {
        reply("❓ Use 'on' or 'off'.");
    }
});

// --- COMMAND: MANUAL DOWNLOAD ---
cmd({
    pattern: "dl",
    alias: ["download"],
    desc: "Download any video via link.",
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
        reply("❌ Download failed.");
    }
});

/**
 * Function to send the final result to WhatsApp
 */
async function sendResult(conn, m, from, media) {
    const results = Array.isArray(media) ? media : [media];
    for (let item of results) {
        let downloadUrl = typeof item === 'string' ? item : (item.url || item.downloadUrl || item.link);
        if (!downloadUrl) continue;

        if (downloadUrl.includes(".mp4") || downloadUrl.includes("video") || downloadUrl.includes("googlevideo")) {
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
}

/**
 * AUTO-DL LISTENER
 * This needs to be called in your main message handler (index.js)
 */
async function handleAutoDL(conn, m) {
    if (!autoDlStatus || !m.text || m.key.fromMe) return;

    const match = m.text.match(anyVideoRegex);
    if (match) {
        const url = match[0];
        const from = conn.decodeJid(m.chat);
        
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
