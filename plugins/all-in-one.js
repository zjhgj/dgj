const { cmd } = require('../command');
const axios = require('axios');

// Auto-DL status set to true by default
let autoDlStatus = true; 

// Updated Regex for better detection
const dlRegex = /https?:\/\/(www\.)?(instagram\.com|tiktok\.com|facebook\.com|fb\.watch|youtu\.be|youtube\.com|fb\.com)\/[^\s]+/gi;

/**
 * AUTO DOWNLOADER
 * Fixed to trigger on any message containing a link
 */
cmd({
    on: "body" // Changed from 'text' to 'body' to catch everything reliably
}, async (conn, mek, m, { from, body, isGroup, reply }) => {
    try {
        // Validation: Check if status is ON and it's not the bot's own message
        if (!autoDlStatus || !body || m.key.fromMe) return;

        // Link search
        const links = body.match(dlRegex);
        if (!links) return;

        const url = links[0];
        
        // Show user the bot is processing
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Using a reliable download API
        const apiUrl = `https://api.giftedtech.my.id/api/download/dl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        
        const data = response.data.result;
        if (!data) return;

        // Handle different platforms
        let downloadUrl = data.download_url || data.video_url || data.url || data.hd;
        let caption = "✨ *Auto Downloaded*";

        if (downloadUrl) {
            await conn.sendMessage(from, { 
                video: { url: downloadUrl }, 
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: m });
            
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        }

    } catch (e) {
        console.log("AutoDL Error:", e.message);
        // No reply here to avoid spamming chat if a link is just a normal text
    }
});

// Settings Command
cmd({
    pattern: "autodl",
    desc: "Turn Auto Downloader ON/OFF",
    category: "config",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    if (!q) return reply(`⚙️ *Auto-DL:* ${autoDlStatus ? "ON ✅" : "OFF ❌"}\nUse: .autodl on/off`);
    
    if (q.toLowerCase() === "on") {
        autoDlStatus = true;
        reply("✅ *Auto Downloader Enabled.*");
    } else if (q.toLowerCase() === "off") {
        autoDlStatus = false;
        reply("❌ *Auto Downloader Disabled.*");
    }
});
