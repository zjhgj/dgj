const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "play22",
    alias: ["song22", "music", "ytplay"],
    react: "🛰️",
    desc: "Download audio from YouTube with stylish selection.",
    category: "download",
    use: ".play <query or url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚠️ *KAMRAN-MD CORE:* Search query or URL is required.");

        // --- PHASE 1: DATA ACQUISITION ---
        let video;
        const isUrl = q.match(/(youtube\.com|youtu\.be)/);

        if (isUrl) {
            const search = await yts(q);
            video = search.videos[0];
        } else {
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ *KAMRAN-MD ERROR:* No results found.");
            video = search.videos[0];
        }

        const { url, title, timestamp, thumbnail, views, author } = video;

        // --- PHASE 2: STYLISH UI ---
        let selectionMsg = `✨ *𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃 𝐂𝐎𝐑𝐄* ✨
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
📝 *ᴛɪᴛʟᴇ:* ${title.toUpperCase().substring(0, 35)}...
🕒 *ᴅᴜʀᴀᴛɪᴏɴ:* ${timestamp}
👁‍🗨 *ᴠɪᴇᴡs:* ${views.toLocaleString()}
👤 *ᴄʜᴀɴɴᴇʟ:* ${author.name}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*📡 ᴛʀᴀɴsᴍɪssɪᴏɴ ᴍᴏᴅᴇs:*

  [1] 🎵 *ᴀᴜᴅɪᴏ (ᴍᴘ3)*
  [2] 📂 *ᴅᴏᴄᴜᴍᴇɴᴛ (ғɪʟᴇ)*
  [3] 🎤 *ᴠᴏɪᴄᴇ ɴᴏᴛᴇ (ᴘᴛᴛ)*

▬▬▬▬▬▬▬▬▬▬▬▬▬▬
> 🚩 *Reply with 1, 2 or 3 to select*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: selectionMsg 
        }, { quoted: m });

        // --- PHASE 3: INTERACTION HANDLER ---
        const listener = async (msg) => {
            if (!msg.message) return;
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && ['1', '2', '3'].includes(body)) {
                // Remove listener immediately
                conn.ev.off('messages.upsert', listener);

                // Update UI to Processing State
                await conn.sendMessage(from, { 
                    text: `🛰️ *ᴘʀᴏᴄᴇssɪɴɢ:* [▰▰▰▰▱▱▱▱] 50%\n\nFetching high-quality audio stream...`, 
                    edit: key 
                });

                try {
                    // API Call
                    const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
                    const response = await axios.get(apiUrl);
                    const data = response.data;

                    if (!data.status || !data.audio) {
                        return await conn.sendMessage(from, { text: "❌ *FATAL ERROR:* Stream extraction failed.", edit: key });
                    }

                    // Update UI to Success State
                    await conn.sendMessage(from, { 
                        text: `✅ *ᴄᴏᴍᴘʟᴇᴛᴇ:* [▰▰▰▰▰▰▰▰▰▰] 100%\n\nSending data packet...`, 
                        edit: key 
                    });

                    const audioConfig = {
                        audio: { url: data.audio },
                        mimetype: 'audio/mpeg',
                        contextInfo: {
                            externalAdReply: {
                                title: "𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃 𝐀𝐔𝐃𝐈𝐎 𝐏𝐋𝐀𝐘𝐄𝐑",
                                body: title,
                                thumbnail: (await axios.get(thumbnail, { responseType: 'arraybuffer' })).data,
                                sourceUrl: url,
                                mediaType: 1,
                                showAdAttribution: true,
                                renderLargerThumbnail: true
                            }
                        }
                    };

                    // Execution based on selection
                    if (body === '1') {
                        await conn.sendMessage(from, { ...audioConfig, ptt: false }, { quoted: m });
                    } else if (body === '2') {
                        await conn.sendMessage(from, {
                            document: { url: data.audio },
                            mimetype: 'audio/mpeg',
                            fileName: `${title}.mp3`,
                            caption: `*✅ Transmitted by Kamran-MD*`
                        }, { quoted: m });
                    } else if (body === '3') {
                        await conn.sendMessage(from, { ...audioConfig, ptt: true }, { quoted: m });
                    }

                    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

                } catch (apiErr) {
                    console.error(apiErr);
                    await conn.sendMessage(from, { text: "❌ *API ERROR:* Connection failed.", edit: key });
                }
            }
        };

        conn.ev.on('messages.upsert', async (chatUpdate) => {
            for (const msg of chatUpdate.messages) {
                await listener(msg);
            }
        });

    } catch (error) {
        console.error(error);
        await reply(`❌ *KAMRAN-MD SYSTEM ERROR:* ${error.message}`);
    }
});
