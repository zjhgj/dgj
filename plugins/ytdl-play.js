const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "play09",
    alias: ["song45", "music", "ytplay"],
    react: "🛰️",
    desc: "Download audio from YouTube with stylish selection.",
    category: "download",
    use: ".play <query or url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚠️ *KAMRAN-MD CORE:* Input required (Name or URL).");

        // --- PHASE 1: SEARCH ---
        let video;
        const isUrl = q.match(/(youtube\.com|youtu\.be)/);
        if (isUrl) {
            const search = await yts(q);
            video = search.videos[0];
        } else {
            const search = await yts(q);
            if (!search || !search.videos.length) return await reply("❌ *KAMRAN-MD:* Result not found.");
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
> 🚩 *Please reply with 1, 2 or 3*`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: selectionMsg 
        }, { quoted: m });

        const messageId = sentMsg.key.id;

        // --- PHASE 3: ROBUST LISTENER ---
        const handler = async (chatUpdate) => {
            const msg = chatUpdate.messages[0];
            if (!msg.message) return;

            const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
            const context = msg.message.extendedTextMessage?.contextInfo;

            // Check if user is replying to the menu
            if (context && context.stanzaId === messageId && ['1', '2', '3'].includes(body)) {
                
                // Stop listening once valid reply is received
                conn.ev.off('messages.upsert', handler);

                await conn.sendMessage(from, { 
                    text: `🛰️ *ᴘʀᴏᴄᴇssɪɴɢ:* Loading *${title}* stream...`, 
                    edit: sentMsg.key 
                });

                try {
                    // Fastest Worker API
                    const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
                    const response = await axios.get(apiUrl);
                    const data = response.data;

                    if (!data.status || !data.audio) throw new Error("API Failure");

                    await conn.sendMessage(from, { 
                        text: `✅ *ᴄᴏᴍᴘʟᴇᴛᴇ:* Transmitting file...`, 
                        edit: sentMsg.key 
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

                    if (body === '1') {
                        await conn.sendMessage(from, { ...audioConfig, ptt: false }, { quoted: m });
                    } else if (body === '2') {
                        await conn.sendMessage(from, {
                            document: { url: data.audio },
                            mimetype: 'audio/mpeg',
                            fileName: `${title}.mp3`
                        }, { quoted: m });
                    } else if (body === '3') {
                        await conn.sendMessage(from, { ...audioConfig, ptt: true }, { quoted: m });
                    }

                    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

                } catch (err) {
                    await conn.sendMessage(from, { text: "❌ *ERROR:* Failed to fetch audio.", edit: sentMsg.key });
                }
            }
        };

        // Add listener
        conn.ev.on('messages.upsert', handler);

        // Auto-remove listener after 60 seconds if no reply (Timeout)
        setTimeout(() => {
            conn.ev.off('messages.upsert', handler);
        }, 60000);

    } catch (error) {
        reply(`❌ *KAMRAN-MD:* ${error.message}`);
    }
});
