const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
    pattern: "play",
    alias: ["ytplay", "music", "video"],
    react: "🛰️",
    desc: "Download Audio or Video from YouTube",
    category: "download",
    use: ".play <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a song name or URL.");

        // --- PHASE 1: SEARCH DATA ---
        let videoUrl, title, timestamp, thumbnail;
        
        const search = await yts(q);
        if (!search.videos.length) return await reply("❌ **CORE ERROR:** NOT FOUND");
        
        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
        timestamp = search.videos[0].timestamp;
        thumbnail = search.videos[0].thumbnail;

        // --- PHASE 2: SELECTION BOX ---
        let selectionMsg = `╔═══════════════╗
   ✰  **KAMRAN-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${title.toUpperCase().substring(0, 25)}
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${timestamp}
╟──────────────╢
│  **sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:**
│
│  1 ➮ ᴠɪᴅᴇᴏ (ᴍᴘ4) 🎬
│  2 ➮ ᴀᴜᴅɪᴏ (ᴍᴘ3) 🎵
╚═══════════════╝
> *Reply with 1 or 2*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: selectionMsg 
        }, { quoted: mek });

        // --- PHASE 3: RESPONSE LISTENER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && ['1', '2'].includes(body)) {
                conn.ev.off('messages.upsert', listener);

                // Show processing status
                await conn.sendMessage(from, { react: { text: "⏳", key: msg.key } });

                if (body === '1') {
                    // --- VIDEO DOWNLOAD (Using Jawad-Tech API) ---
                    const videoApi = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
                    const response = await fetch(videoApi);
                    const data = await response.json();

                    if (!data.result || !data.result.video) {
                        return await reply("❌ **ERROR:** Video download failed.");
                    }

                    await conn.sendMessage(from, { 
                        video: { url: data.result.video }, 
                        caption: `*${title}*\n\n> © KAMRAN-MD`,
                        mimetype: 'video/mp4'
                    }, { quoted: mek });

                } else if (body === '2') {
                    // --- AUDIO DOWNLOAD (Using David Cyril API) ---
                    const audioApi = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                    const response = await fetch(audioApi);
                    const data = await response.json();

                    if (!data.success || !data.result.download_url) {
                        return await reply("❌ **ERROR:** Audio download failed.");
                    }

                    await conn.sendMessage(from, { 
                        audio: { url: data.result.download_url }, 
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        contextInfo: {
                            externalAdReply: {
                                title: "KAMRAN-MD DOWNLOADER",
                                body: title,
                                thumbnailUrl: thumbnail,
                                sourceUrl: videoUrl,
                                mediaType: 1,
                                showAdAttribution: true
                            }
                        }
                    }, { quoted: mek });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }
        };

        conn.ev.on('messages.upsert', async (chatUpdate) => {
            for (const msg of chatUpdate.messages) { await listener(msg); }
        });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** ${error.message}`);
    }
});
