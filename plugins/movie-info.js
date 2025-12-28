//---------------------------------------------------------------------------
//           KAMRAN-MD - POWERFUL YTDL (FIXED SEARCH)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// Newsletter Context
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

// Memory to store user sessions
const ytdlSession = new Map();

cmd({
    pattern: "ytdl",
    alias: ["yt", "downloadyt"],
    desc: "Download YouTube videos/audio with fixed selection.",
    category: "download",
    react: "🎥",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("🎥 *YouTube Downloader*\n\nUsage: `.ytdl <link>`\nExample: `.ytdl https://youtu.be/xxxx` ");

    if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(text))
        return reply("❌ Valid YouTube link bhejein.");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const menu = `╭──〔 *🎥 YTDL MENU* 〕  
├─ 📝 *Target:* YouTube
╰───────────────────🚀

*Niche diye gaye Quality me se ek chunen (Type karein):*

📥 *Audio:*
type *mp3* - High Quality Audio

🎥 *Video:*
type *360* - 360p Quality
type *480* - 480p Quality
type *720* - 720p (HD)
type *1080* - 1080p (Full HD)

*🚀 Powered by KAMRAN-MD*`;

        const sentMsg = await conn.sendMessage(from, { 
            text: menu,
            contextInfo: newsletterContext
        }, { quoted: mek });

        // Session me link aur message ID save karein
        ytdlSession.set(from, { 
            link: text, 
            msgId: sentMsg.key.id,
            timestamp: Date.now() 
        });

    } catch (e) {
        reply("❌ Error: API limit ya network issue.");
    }
});

// Listener for Reply / Selection
cmd({
    on: "text"
}, async (conn, mek, m, { from, text, reply }) => {
    const session = ytdlSession.get(from);
    if (!session) return;

    // Session 5 minute baad expire ho jayegi
    if (Date.now() - session.timestamp > 300000) {
        ytdlSession.delete(from);
        return;
    }

    const input = text.toLowerCase().trim();
    const formats = ["mp3", "144", "240", "360", "480", "720", "1080"];

    if (!formats.includes(input)) return;

    // Sirf wahi user download kar payega jisne command chalayi thi
    // (Optional: m.message.extendedTextMessage.contextInfo.stanzaId check)

    try {
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        ytdlSession.delete(from); // Download shuru hote hi session khatam

        const apiUrl = `https://host.optikl.ink/download/youtube?url=${encodeURIComponent(session.link)}&format=${input}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status) return reply("❌ Download link generate nahi ho saka.");

        const res = data.result;
        const caption = `*✅ Download Complete*\n\n📝 *Title:* ${res.title}\n⚖️ *Quality:* ${input.toUpperCase()}`;

        if (input === "mp3") {
            await conn.sendMessage(from, { 
                audio: { url: res.download }, 
                mimetype: "audio/mpeg",
                contextInfo: newsletterContext
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                video: { url: res.download }, 
                caption: caption,
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        reply("❌ Downloading fail ho gayi. Link expire ho sakta hai.");
    }
});
