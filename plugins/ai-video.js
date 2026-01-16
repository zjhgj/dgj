const config = require('../config');
const { cmd } = require('../command');
const fetch = require('node-fetch');
const yts = require('yt-search');

// Islamic Keywords Filter
const islamicKeywords = [
    'naat', 'quran', 'surah', 'hadith', 'islamic', 'dua', 'azan', 'tafseer', 
    'bayan', 'tilawat', 'hamd', 'nasheed', 'madarsa', 'sunnah', 'salah'
];

cmd({
    pattern: "sania",
    alias: ["svideo", "kamran3", "islamic"],
    react: "🕌",
    desc: "Download Islamic YouTube Content.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`*🤔 Kya search karna hai?*\n\n*Example:* ${prefix}${command} Surah Rahman`);

        // Check for Islamic Content
        const isIslamic = islamicKeywords.some(keyword => q.toLowerCase().includes(keyword));
        if (!isIslamic) {
            return reply("*⚠️ Yeh bot sirf Islamic content ke liye hai.*\n\nKripya Islamic keywords use karein (e.g., Naat, Quran, Hadees).");
        }

        // Search YouTube
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ Content nahi mila!");

        const infoMessage = `╭─〔 *🕌 ISLAMIC DOWNLOADER* 〕
├─▸ *Title:* ${video.title}
├─▸ *Duration:* ${video.timestamp}
├─▸ *Views:* ${video.views}
╰─➤ *Processing your request...*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        // --- 100% FIXED INBOX PATH LOGIC ---
        const botId = conn.user.id;
        const botLid = conn.user.lid;
        const inboxPath = botLid || (botId.includes(':') ? botId.split(':')[0] + "@s.whatsapp.net" : botId);

        // Send Info with Thumbnail
        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: infoMessage,
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD ISLAMIC AI",
                    body: video.title,
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        // --- DOWNLOAD & SEND LOGIC ---
        // Yahan aap apna downloader API use kar sakte hain
        // Wait 5 seconds for stability before sending file
        setTimeout(async () => {
            try {
                // Example: Sending as Audio if command is play
                if (command === 'play' || command === 'audio') {
                    await conn.sendMessage(from, { 
                        audio: { url: `https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${video.url}` }, 
                        mimetype: 'audio/mpeg' 
                    }, { quoted: mek });
                } 
                // Video sending logic
                else if (command === 'video') {
                    await conn.sendMessage(from, { 
                        video: { url: `https://api.fgmods.xyz/api/downloader/ytmp4?url=${video.url}` }, 
                        caption: `*✅ ${video.title} Downloaded*`
                    }, { quoted: mek });
                }
            } catch (err) {
                console.error("Download Error:", err);
                reply("❌ File send karne mein error aaya.");
            }
        }, 5000);

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + e.message);
    }
});
                        
