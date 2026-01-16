const { cmd } = require('../command'); // Aapke bot ka command handler
const fetch = require('node-fetch');
const yts = require('yt-search');

// Islamic Keywords Filter (Bot sirf inhi topics par kaam karega)
const islamicKeywords = [
    'naat', 'quran', 'surah', 'hadith', 'islamic', 'dua', 'azan', 'tafseer', 
    'bayan', 'tilawat', 'hamd', 'nasheed', 'madarsa', 'sunnah', 'salah', 
    'hajj', 'umrah', 'ramadan', 'roza', 'sehri', 'iftar', 'zakat', 'iman'
];

cmd({
    pattern: "iplay",
    alias: ["iaudio", "ivideo", "Islamic"],
    react: "🕌",
    desc: "Download Islamic Content from YouTube.",
    category: "download",
    use: '.play <title>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`*🤔 Kya search karna hai?*\n\n*Example:* ${prefix}${command} Surah Rahman`);

        // Check if query is Islamic
        const queryLower = q.toLowerCase();
        const isIslamic = islamicKeywords.some(keyword => queryLower.includes(keyword));

        if (!isIslamic) {
            return reply("*⚠️ Yeh bot sirf Islamic content download karne ke liye hai.*\n\nKripya Islamic keywords use karein (e.g., Naat, Quran, Hadees, etc).");
        }

        // Search on YouTube
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ Content nahi mila!");

        // Duration Check (Optional)
        const infoMessage = `*✍🏻 ISLAMIC CONTENT FOUND*

🍁 *Title:* ${video.title}
⏰ *Duration:* ${video.timestamp}
🔗 *Link:* ${video.url}

> *Wait a moment while I send your file...*
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        // Send Info Message with Thumbnail
        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: infoMessage,
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD ISLAMIC AI",
                    body: "Searching & Downloading...",
                    mediaType: 1,
                    sourceUrl: video.url,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        // --- Downloading Process ---
        // Hum multiple APIs use kar rahe hain jo aapke original code mein thi
        let downloadUrl = "";
        
        if (command === 'play' || command === 'audio') {
            // Audio API
            let res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${video.url}`);
            let json = await res.json();
            downloadUrl = json.result?.url || json.url;

            if (downloadUrl) {
                await conn.sendMessage(from, { 
                    audio: { url: downloadUrl }, 
                    mimetype: 'audio/mpeg' 
                }, { quoted: mek });
            } else {
                throw new Error("Audio link not found");
            }

        } else if (command === 'video') {
            // Video API
            let res = await fetch(`https://api.fgmods.xyz/api/downloader/ytmp4?url=${video.url}`);
            let json = await res.json();
            downloadUrl = json.result?.dl_url || json.url;

            if (downloadUrl) {
                await conn.sendMessage(from, { 
                    video: { url: downloadUrl }, 
                    caption: `*✅ Downloaded:* ${video.title}\n\n> © KAMRAN-MD`
                }, { quoted: mek });
            } else {
                throw new Error("Video link not found");
            }
        } else if (command === 'playdoc') {
             // Document format mein audio
             let res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${video.url}`);
             let json = await res.json();
             downloadUrl = json.result?.url || json.url;

             await conn.sendMessage(from, { 
                document: { url: downloadUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            }, { quoted: mek });
        }

    } catch (e) {
        console.error(e);
        reply("❌ Download karne mein masla aaya. Shayad API down hai ya video bohot bari hai.");
    }
});
                
