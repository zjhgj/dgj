const { cmd } = require('../command');
const axios = require('axios');

// --- Global Settings ---
global.autoDownload = true; // Default state for Auto-Download

/**
 * Core Downloader Function
 */
async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

/**
 * Auto Download Handler (To be called in main message handler)
 */
async function autoAioHandler(conn, m, isCmd) {
    try {
        if (isCmd) return; // Commands پر آٹو ڈاؤن لوڈ نہیں ہوگا
        if (!m.text) return;
        if (m.key.fromMe) return;
        if (!global.autoDownload) return;

        // لنکس کی پہچان کے لیے ریجیکس (Regex)
        const linkRegex = /https?:\/\/(www\.)?(tiktok\.com|instagram\.com|facebook\.com|fb\.watch|youtube\.com|youtu\.be|x\.com|twitter\.com)\/[^\s]+/gi;
        const match = m.text.match(linkRegex);

        if (match) {
            const url = match[0];
            const targetChat = conn.decodeJid(m.chat);

            const data = await aioDownload(url);
            if (!data.success || !data.results.length) return;

            const r = data.results[0];
            let videoUrl = r.hd_url || r.download_url;
            
            if (videoUrl) {
                await conn.sendMessage(targetChat, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: `✨ *Auto-Download Success* ✨\n\n📌 *Title:* ${r.title || "-"}\n🌐 *Platform:* ${data.platform}\n\n*LID Fix Active*`
                }, { quoted: m });
            }
        }
    } catch (e) {
        // Quiet error to avoid spamming console
    }
}

// --- COMMAND: MANUAL DOWNLOAD ---
cmd({
    pattern: "aio",
    alias: ["dl"],
    react: "📥",
    desc: "Manual AIO Downloader.",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("⚠️ Please provide a link.");
    const targetChat = conn.decodeJid(from);
    const data = await aioDownload(q.trim());
    if (!data.success) return reply("❌ Failed to download.");
    
    const r = data.results[0];
    await conn.sendMessage(targetChat, {
        video: { url: r.hd_url || r.download_url },
        caption: `📥 *AIO Downloader*\n\n📌 ${r.title || "-"}`
    }, { quoted: mek });
});

// --- COMMAND: AUTO-DOWNLOAD ON/OFF ---
cmd({
    pattern: "autodl",
    alias: ["autodownload"],
    desc: "Turn Auto-Download ON or OFF.",
    category: "config",
    filename: __filename
},           
async (conn, mek, m, { q, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Owner only command.");
    
    if (q === 'on') {
        global.autoDownload = true;
        reply("✅ *Auto-Download:* Turned ON. Bot will now automatically download links.");
    } else if (q === 'off') {
        global.autoDownload = false;
        reply("❌ *Auto-Download:* Turned OFF.");
    } else {
        reply(`Current Status: ${global.autoDownload ? "ON" : "OFF"}\nUsage: .autodl on/off`);
    }
});

module.exports = { autoAioHandler };
