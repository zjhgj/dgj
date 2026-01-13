const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
    pattern: "play",
    alias: ["ytplay", "music", "video"],
    react: "🛰️",
    desc: "Download Video or Audio from YouTube",
    category: "download",
    use: ".play <query or url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a song name or YouTube URL.");

        // --- PHASE 1: DATA LOOKUP ---
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return await reply("❌ **CORE ERROR:** No results found.");

        const videoUrl = video.url;
        const title = video.title;
        const timestamp = video.timestamp;
        const thumbnail = video.thumbnail;

        // --- PHASE 2: SELECTION MENU ---
        let selectionMsg = `╔═══════════════╗
   ✰  *KAMRAN-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰
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
            const senderId = msg.key.remoteJid;
            if (senderId !== from) return;

            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && ['1', '2'].includes(body)) {
                // Turn off listener after selection
                conn.ev.off('messages.upsert', listener);

                await conn.sendMessage(from, { react: { text: "⏳", key: msg.key } });

                if (body === '1') {
                    // --- VIDEO DOWNLOAD (MP4) ---
                    const videoApi = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
                    const response = await fetch(videoApi);
                    const data = await response.json();

                    if (!data.success || !data.result?.download_url) {
                        return await reply("❌ **FATAL ERROR:** Video download failed.");
                    }

                    await conn.sendMessage(from, {
                        video: { url: data.result.download_url },
                        mimetype: 'video/mp4',
                        caption: `🎬 *${title}*\n\n> © KAMRAN-MD ⚡`,
                        contextInfo: {
                            externalAdReply: {
                                title: "KAMRAN-MD VIDEO PLAYER",
                                body: title,
                                thumbnailUrl: thumbnail,
                                sourceUrl: videoUrl,
                                mediaType: 2,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: mek });

                } else if (body === '2') {
                    // --- AUDIO DOWNLOAD (MP3) ---
                    const audioApi = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                    const response = await fetch(audioApi);
                    const data = await response.json();

                    if (!data.success || !data.result?.download_url) {
                        return await reply("❌ **FATAL ERROR:** Audio download failed.");
                    }

                    await conn.sendMessage(from, {
                        audio: { url: data.result.download_url },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        contextInfo: {
                            externalAdReply: {
                                title: "KAMRAN-MD AUDIO PLAYER",
                                body: title,
                                thumbnailUrl: thumbnail,
                                sourceUrl: videoUrl,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: mek });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }
        };

        // Activate the listener
        conn.ev.on('messages.upsert', async (chatUpdate) => {
            for (const msg of chatUpdate.messages) {
                await listener(msg);
            }
        });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** ${error.message}`);
    }
});
        
