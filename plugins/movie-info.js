//---------------------------------------------------------------------------
//           KAMRAN-MD - YTDL FIXED (SEARCH & DOWNLOAD)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

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

// Global object to store temporary user data
const ytDataStore = {};

cmd({
    pattern: "ytdlk",
    alias: ["ytq", "ytrs", "uvideo"],
    desc: "Download YouTube with easy selection.",
    category: "download",
    react: "🎥",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("🎥 *YouTube Downloader*\n\nUsage: `.ytdl <link>`\nExample: `.ytdl https://youtu.be/kY3n5O_D4F4` ");

    if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(text))
        return reply("❌ *Aapka link galat hai!* Sahi YouTube link dein.");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // User ka link save kar rahe hain
        ytDataStore[from] = { url: text, active: true };

        const menu = `╭──〔 *🎥 YTDL MENU* 〕  
├─ 📝 *Provider:* Optikl Engine
╰───────────────────🚀

*Download karne ke liye niche likha text type karke send karein:*

🎧 *AUDIO:*
Type *mp3* - High Quality MP3

🎥 *VIDEO:*
Type *360* - Low Quality
Type *480* - Medium Quality
Type *720* - HD Quality
Type *1080* - Full HD Quality

*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, { 
            text: menu,
            contextInfo: newsletterContext
        }, { quoted: mek });

    } catch (e) {
        reply("❌ API limit ya network issue!");
    }
});

// Listener: Jab user 360, 720 ya mp3 likhega
cmd({
    on: "text"
}, async (conn, mek, m, { from, text, reply }) => {
    // Agar user ne ytdl command nahi chalayi toh kuch mat karo
    if (!ytDataStore[from] || !ytDataStore[from].active) return;

    const input = text.toLowerCase().trim();
    const formats = ["mp3", "360", "480", "720", "1080"];

    // Agar user format ke bajaye kuch aur likhta hai toh cancel
    if (!formats.includes(input)) return;

    const videoUrl = ytDataStore[from].url;
    ytDataStore[from].active = false; // Task shuru hone par session close

    try {
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const apiUrl = `https://host.optikl.ink/download/youtube?url=${encodeURIComponent(videoUrl)}&format=${input}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status) {
            delete ytDataStore[from];
            return reply("❌ Download link nahi mil saka. Shayad video private hai.");
        }

        const res = data.result;
        const info = `*✅ Download Complete*\n\n📝 *Title:* ${res.title}\n⚖️ *Quality:* ${input.toUpperCase()}`;

        if (input === "mp3") {
            await conn.sendMessage(from, { 
                audio: { url: res.download }, 
                mimetype: "audio/mpeg",
                contextInfo: newsletterContext
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                video: { url: res.download }, 
                caption: info,
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        delete ytDataStore[from];

    } catch (e) {
        delete ytDataStore[from];
        reply("❌ Error occurred! Try again later.");
    }
});
