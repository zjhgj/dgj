const { cmd } = require('../command');
const axios = require('axios');

// --- Global Variable for Auto-DL State ---
// Default is ON. You can change to false to keep it off by default.
let autoDlStatus = true; 

// Supported Links Detection Regex
const dlRegex = /https?:\/\/(www\.)?(instagram\.com|tiktok\.com|facebook\.com|fb\.watch|youtu\.be|youtube\.com)\/[^\s]+/gi;

/**
 * AUTO DOWNLOAD LOGIC (LISTENER)
 * This part monitors every message for links
 */
cmd({
    on: "text" // This makes it listen to every incoming text message
}, async (conn, mek, m, { from, body, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        // Skip if Auto-DL is OFF or message is from the bot itself
        if (!autoDlStatus || !body || m.key.fromMe) return;

        const links = body.match(dlRegex);
        if (!links) return; // No supported link found

        const url = links[0];
        
        // Visual feedback that bot is working
        await conn.sendMessage(from, { react: { text: "📥", key: m.key } });

        // API Call to fetch media
        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        
        let media = response.data.result || response.data.data || response.data;
        if (!media) return;

        const results = Array.isArray(media) ? media : [media];

        for (let item of results) {
            let downloadUrl = typeof item === 'string' ? item : (item.url || item.downloadUrl || item.link);
            if (!downloadUrl) continue;

            // Detect if it's a video or image based on URL extension or API data
            if (downloadUrl.includes(".mp4") || downloadUrl.includes("video") || downloadUrl.includes("googlevideo")) {
                await conn.sendMessage(from, { 
                    video: { url: downloadUrl }, 
                    caption: "✨ *Auto Downloaded*",
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, { 
                    image: { url: downloadUrl },
                    caption: "✨ *Auto Downloaded*"
                }, { quoted: m });
            }
        }
        
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        // Silent error for auto-dl to avoid spamming chat if API fails
        console.error("AutoDL Error:", e.message);
    }
});

// --- COMMAND: TOGGLE AUTO-DL ---
cmd({
    pattern: "autodl",
    desc: "Turn Auto Downloader ON or OFF.",
    category: "config",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    if (!q) return reply(`🤖 *Auto-DL Status:* ${autoDlStatus ? "ON ✅" : "OFF ❌"}\n\n*Usage:* .autodl on / .autodl off`);
    
    if (q.toLowerCase() === "on") {
        autoDlStatus = true;
        reply("✅ *Auto Downloader Enabled.* Now I will download links automatically.");
    } else if (q.toLowerCase() === "off") {
        autoDlStatus = false;
        reply("❌ *Auto Downloader Disabled.*");
    } else {
        reply("❓ Please use 'on' or 'off'.");
    }
});

// --- COMMAND: MANUAL DL (Backup) ---
cmd({
    pattern: "dl",
    alias: ["get"],
    desc: "Manual downloader in case auto-dl is off.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("❓ Link share karen.");
    try {
        const response = await axios.get(`https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(q)}`);
        const media = response.data.result || response.data.data;
        // logic for manual sending...
        reply("Downloading...");
    } catch (e) {
        reply("❌ Error!");
    }
});
