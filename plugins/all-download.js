//---------------------------------------------------------------------------
//           KAMRAN-MD - AUTO DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 ALL-IN-ONE AUTO DOWNLOAD SYSTEM (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

// Main Auto-Download Logic
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup, isAdmins, isBotAdmins, reply, sender }) => {
    try {
        // Regex to detect common social media URLs
        const urlMatch = body.match(/\bhttps?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
        
        if (!urlMatch) return; // No URL found

        const url = urlMatch[0];
        const isSocial = /facebook|fb|instagram|tiktok|twitter|x\.com|youtube|youtu\.be|pin\.it|pinterest|threads\.net/gi.test(url);

        if (!isSocial) return;

        // Reactive UI - Let the user know bot is processing
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const apiUrl = `https://all-in-one-downloader-six.vercel.app/api/download?url=${encodeURIComponent(url)}`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if download link is found in API response
        // Note: adjust 'data.url' based on the exact JSON structure of your API
        const downloadUrl = data.url || data.link || (data.data && data.data.main_url);
        const title = data.title || "KAMRAN-MD DOWNLOADER";

        if (!downloadUrl) {
            return await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }

        const messageOptions = {
            video: { url: downloadUrl },
            caption: `*🎬 Title:* ${title}\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: newsletterContext
        };

        // If it's an image (Pinterest/IG Post)
        if (data.type === 'image' || downloadUrl.includes('.jpg') || downloadUrl.includes('.png')) {
            messageOptions.video = undefined;
            messageOptions.image = { url: downloadUrl };
        }

        await conn.sendMessage(from, messageOptions, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Auto Download Error:", error);
        // Silent fail to avoid spamming in groups
    }
});

// Toggle Command for Auto-Downloader
cmd({
    pattern: "autodl",
    alias: ["autodownload"],
    desc: "Enable/Disable Auto Downloader",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Owner only.");
    const status = args[0]?.toLowerCase();
    
    if (status === "on") {
        config.AUTO_DL = "true";
        return reply("✅ Auto Downloader enabled.");
    } else if (status === "off") {
        config.AUTO_DL = "false";
        return reply("❌ Auto Downloader disabled.");
    } else {
        reply("Usage: .autodl on/off");
    }
});
