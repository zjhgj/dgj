const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch'); // Ensure fetch is available

cmd({
    pattern: "play",
    alias: ["ytplay", "music"],
    react: "🛰️",
    desc: "Download audio from YouTube via Search or Link",
    category: "download",
    use: ".play <song name or youtube link>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a song name or a YouTube URL.");

        let videoUrl, title, timestamp, thumbnail;

        // --- PHASE 1: SMART DATA EXTRACTION (LINK OR SEARCH) ---
        const isUrl = q.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/);

        if (isUrl) {
            // If it's a link, fetch info directly
            const search = await yts(q);
            const video = search.videos[0]; 
            if (!video) return await reply("❌ **CORE ERROR:** Invalid YouTube Link.");
            
            videoUrl = video.url;
            title = video.title;
            timestamp = video.timestamp;
            thumbnail = video.thumbnail;
        } else {
            // If it's text, perform a search
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ **CORE ERROR:** No results found for your query.");
            
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            timestamp = search.videos[0].timestamp;
            thumbnail = search.videos[0].thumbnail;
        }

        // --- PHASE 2: SELECTION MENU ---
        let selectionMsg = `╔═══════════════╗
   ✰  **KAMRAN-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${title.substring(0, 30)}...
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${timestamp}
╟──────────────╢
│  **sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:**
│
│  1 ➮ ᴀᴜᴅɪᴏ (ᴍᴘ3) 🎵
│  2 ➮ ᴅᴏᴄᴜᴍᴇɴᴛ (ғɪʟᴇ) 📂
│  3 ➮ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ (ᴘᴛᴛ) 🎤
╚═══════════════╝
> *Reply with 1, 2, or 3*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: selectionMsg 
        }, { quoted: mek });

        // --- PHASE 3: RESPONSE LISTENER ---
        const listener = async (msg) => {
            const sender = msg.key.remoteJid;
            if (sender !== from) return;

            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && ['1', '2', '3'].includes(body)) {
                // Remove listener once selection is made
                conn.ev.off('messages.upsert', listener);

                // Show processing status
                await conn.sendMessage(from, { react: { text: "⏳", key: msg.key } });

                // API Call
                const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (!data.success || !data.result.download_url) {
                    return await reply("❌ **FATAL ERROR:** Connection to download server failed.");
                }

                const downloadUrl = data.result.download_url;
                const commonConfig = {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
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
                };

                if (body === '1') {
                    // Send as Standard Audio
                    await conn.sendMessage(from, { ...commonConfig }, { quoted: mek });
                } else if (body === '2') {
                    // Send as Document File
                    await conn.sendMessage(from, {
                        document: { url: downloadUrl },
                        mimetype: 'audio/mpeg',
                        fileName: `${title}.mp3`
                    }, { quoted: mek });
                } else if (body === '3') {
                    // Send as Voice Note (PTT)
                    await conn.sendMessage(from, { ...commonConfig, ptt: true }, { quoted: mek });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }
        };

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
