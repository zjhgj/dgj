//---------------------------------------------------------------------------
//           KAMRAN-MD - AUTO DOWNLOADER (ADVANCED)
//---------------------------------------------------------------------------
//  🚀 MULTI-API AUTO DOWNLOAD SYSTEM (LID & NEWSLETTER SUPPORT)
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
}, async (conn, mek, m, { from, body, isGroup, reply, sender }) => {
    try {
        // Global toggle check
        if (config.AUTO_DL !== "true") return;

        // Regex to detect URLs
        const urlMatch = body.match(/\bhttps?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
        if (!urlMatch) return;

        const url = urlMatch[0];
        let apiUrl = "";
        let method = "video"; // Default

        // --- Specific API Selection ---
        
        // 1. YouTube Logic
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            if (body.toLowerCase().includes("mp3") || body.toLowerCase().includes("audio")) {
                apiUrl = `https://apis-bandaheali.vercel.app/download/ytmp3?url=${encodeURIComponent(url)}`;
                method = "audio";
            } else {
                apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
            }
        } 
        // 2. TikTok Logic
        else if (url.includes("tiktok.com")) {
            apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
        } 
        // 3. Facebook Logic
        else if (url.includes("facebook.com") || url.includes("fb.watch")) {
            apiUrl = `https://edith-apis.vercel.app/download/facebook?url=${encodeURIComponent(url)}`;
        } 
        // 4. Spotify Logic
        else if (url.includes("spotify.com")) {
            apiUrl = `https://api.deline.web.id/downloader/spotifyplay?q=${encodeURIComponent(url)}`;
            method = "audio";
        }
        // 5. All-in-One Backup (For Instagram, Twitter, etc.)
        else if (/instagram|twitter|x\.com|pin\.it|pinterest|threads\.net/gi.test(url)) {
            apiUrl = `https://all-in-one-downloader-six.vercel.app/api/download?url=${encodeURIComponent(url)}`;
        }

        if (!apiUrl) return;

        // Reactive UI
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const response = await axios.get(apiUrl);
        const res = response.data;
        
        // Extraction based on different API formats
        let downloadUrl = res.url || res.link || (res.data && (res.data.url || res.data.main_url || res.data.download)) || (res.result && (res.result.url || res.result.hd || res.result.sd || res.result.download));
        let title = res.title || (res.data && res.data.title) || (res.result && res.result.title) || "KAMRAN-MD DOWNLOADER";

        if (!downloadUrl) {
            return await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }

        // Sending Media
        if (method === "audio") {
            await conn.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: newsletterContext
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                video: { url: downloadUrl }, 
                caption: `*🎬 Title:* ${title}\n\n*🚀 Powered by KAMRAN-MD*`,
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("AutoDL Error:", error.message);
    }
});

// Toggle Command
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
