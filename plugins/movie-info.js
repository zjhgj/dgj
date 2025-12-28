//---------------------------------------------------------------------------
//           KAMRAN-MD - ADVANCED YTDL (OPTIKL ENGINE)
//---------------------------------------------------------------------------
//  🚀 ALL QUALITIES SUPPORTED (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

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

class YouTubeDownloader {
    static FORMATS = {
        mp3: "MP3 (Audio Only)",
        144: "144p",
        240: "240p",
        360: "360p",
        480: "480p",
        720: "720p (HD)",
        1080: "1080p (Full HD)"
    };

    static API_URL = "https://host.optikl.ink/download/youtube";

    static async fetchVideoInfo(url, format) {
        const fmt = format.toLowerCase();
        const { data } = await axios.get(this.API_URL, {
            params: { url, format: fmt },
            timeout: 60000,
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!data.status || data.code !== 200)
            throw new Error(data.message || "Failed to fetch data from Optikl API");

        const r = data.result;
        return {
            title: r.title || "No Title",
            duration: this.formatDuration(r.duration),
            thumbnail: r.thumbnail,
            quality: r.quality || fmt.toUpperCase(),
            downloadUrl: r.download,
            type: fmt === "mp3" ? "audio" : "video"
        };
    }

    static formatDuration(seconds) {
        if (!seconds) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
            : `${m}:${s.toString().padStart(2, "0")}`;
    }
}

// Memory session to handle replies
const ytdlSession = {};

cmd({
    pattern: "ytdl",
    alias: ["yts", "video3"],
    desc: "Download YouTube videos/audio in high quality.",
    category: "download",
    react: "🎥",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("🎥 *KAMRAN-MD YTDL*\n\nUsage: `.ytdl <link>`\nExample: `.ytdl https://youtu.be/xxxx` ");

    if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(text))
        return reply("❌ Please provide a valid YouTube link.");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const listText = Object.entries(YouTubeDownloader.FORMATS)
            .map(([k, v]) => `*${k}* ➟  ${v}`)
            .join("\n");

        const caption = `╭──〔 *🎥 YTDL MENU* 〕  
├─ 📝 *Target:* Detected
├─ 📂 *Provider:* Optikl Engine
╰───────────────────🚀

*Select Quality (Reply with Number/Key):*
${listText}

*🚀 Powered by KAMRAN-MD*`;

        const sentMsg = await conn.sendMessage(from, { 
            text: caption,
            contextInfo: newsletterContext
        }, { quoted: mek });

        // Save to session
        ytdlSession[from] = { link: text, msgId: sentMsg.key.id };

    } catch (e) {
        console.error(e);
        reply("❌ Error processing request.");
    }
});

// Listener for replies
cmd({
    on: "text"
}, async (conn, mek, m, { from, text, reply }) => {
    const session = ytdlSession[from];
    if (!session) return;
    
    // Check if user is replying to the bot's quality menu
    const isReply = m.message?.extendedTextMessage?.contextInfo?.stanzaId === session.msgId;
    if (!isReply) return;

    const format = text.toLowerCase().trim();
    if (!YouTubeDownloader.FORMATS[format]) return;

    try {
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        delete ytdlSession[from]; // Clear session after selection

        const info = await YouTubeDownloader.fetchVideoInfo(session.link, format);

        const caption = `╭──〔 *📥 YTDL COMPLETE* 〕  
├─ 📝 *Title:* ${info.title}
├─ ⏲️ *Duration:* ${info.duration}
├─ ⚖️ *Quality:* ${info.quality}
╰───────────────────🚀`;

        if (info.type === "audio") {
            await conn.sendMessage(from, { 
                audio: { url: info.downloadUrl }, 
                mimetype: "audio/mpeg", 
                contextInfo: {
                    ...newsletterContext,
                    externalAdReply: {
                        title: info.title,
                        body: `Duration: ${info.duration}`,
                        thumbnailUrl: info.thumbnail,
                        sourceUrl: session.link,
                        mediaType: 1,
                        showAdAttribution: true
                    }
                }
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                video: { url: info.downloadUrl }, 
                caption: caption,
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
