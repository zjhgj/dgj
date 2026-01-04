//---------------------------------------------------------------------------
//           KAMRAN-MD - AIO DOWNLOADER & AUTO-DL (MIFINFINITY)
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD FROM TIKTOK, IG, FB, YT AUTOMATICALLY OR BY COMMAND
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// In-memory storage for Auto-DL status (Reset on restart)
// For permanent storage, you can use your database
const autoDlSettings = new Map();

/**
 * Core Downloader Function
 */
async function fetchMedia(url) {
    try {
        const apiUrl = `https://api.mifinfinity.my.id/api/downloader/aio?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);
        if (data.status && data.result) return data.result;
        return null;
    } catch (e) {
        return null;
    }
}

// --- COMMAND: DOWNLOAD (Manual) ---

cmd({
    pattern: "dl",
    alias: ["get", "down"],
    desc: "All-in-one downloader for social media.",
    category: "download",
    use: ".dl <link>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    if (!q) return reply(`🔗 *AIO Downloader*\n\nUsage: \`${prefix + command} <link>\`\nExample: \`${prefix + command} https://www.instagram.com/p/xxx\``);
    
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    const res = await fetchMedia(q);
    
    if (!res) return reply("❌ Link not supported or API error.");

    // Handle Video/Image based on API result
    const mediaUrl = res.url || res.video || res.hd || res.mp4;
    if (!mediaUrl) return reply("❌ Could not extract download link.");

    await conn.sendMessage(from, {
        video: { url: mediaUrl },
        caption: `✅ *Downloaded Successfully*\n\n*🚀 Powered by KAMRAN-MD*`,
    }, { quoted: mek });
    
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
});

// --- COMMAND: AUTODL SETTINGS ---

cmd({
    pattern: "autodl",
    desc: "Turn Auto-Download On or Off for this chat.",
    category: "config",
    use: ".autodl on/off",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    // Only admins or owner can change settings
    if (!isAdmins && !isOwner) return reply("❌ This command is only for Admins.");
    
    if (q === "on") {
        autoDlSettings.set(from, true);
        return reply("✅ *Auto-Download is now ON* for this chat.\nI will automatically download links from TikTok, IG, FB, etc.");
    } else if (q === "off") {
        autoDlSettings.set(from, false);
        return reply("❌ *Auto-Download is now OFF* for this chat.");
    } else {
        return reply(`❓ Usage: \`.autodl on\` or \`.autodl off\``);
    }
});

// --- AUTO-DL LISTENER ---

// We export a listener function that your main bot (index.js) can call on every message
// If KAMRAN-MD uses a specific event for this, you can integrate it there
// Here is a generic handler that looks for links:

cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    const isEnabled = autoDlSettings.get(from);
    if (!isEnabled) return;

    // Regex for common social media links
    const urlRegex = /https?:\/\/(www\.)?(tiktok|instagram|facebook|fb|youtube|youtu|x|twitter)\.com\/[^\s]+/gi;
    const match = body.match(urlRegex);

    if (match) {
        const link = match[0];
        console.log(`[AutoDL] Detected link: ${link}`);

        const res = await fetchMedia(link);
        if (res) {
            const mediaUrl = res.url || res.video || res.hd || res.mp4;
            if (mediaUrl) {
                await conn.sendMessage(from, {
                    video: { url: mediaUrl },
                    caption: `🎬 *Auto Downloader*\n\n*🚀 Powered by KAMRAN-MD*`
                }, { quoted: mek });
            }
        }
    }
});
