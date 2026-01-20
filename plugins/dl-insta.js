const { cmd } = require('../command');
const axios = require('axios');

/**
 * Instagram Downloader Command
 */
cmd({
    pattern: "instagram",
    alias: ["ig", "igdl", "insta"],
    react: "📸",
    desc: "Download Instagram Videos, Photos, or Reels.",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`*Usage:* ${prefix}ig <link>\n*Example:* ${prefix}ig https://www.instagram.com/p/Cxxxx/`);

        const targetChat = conn.decodeJid(from);
        await conn.sendMessage(targetChat, { react: { text: "⏳", key: m.key } });

        // API Call (Using the logic from your snippet)
        // Note: Make sure the API endpoint is accessible
        const apiUrl = `https://api.izumi.app/downloader/instagram/v1?url=${encodeURIComponent(q.trim())}`;
        const response = await axios.get(apiUrl);
        const resData = response.data;

        if (!resData || !resData.result || !resData.result.media) {
            return reply("❌ Failed to fetch Instagram media. Link might be private or invalid.");
        }

        const media = resData.result.media; // Array of media objects
        const isVideo = media[0].isVideo;
        const title = resData.result.caption || "Instagram Media";

        const caption = `
📸 *INSTAGRAM DOWNLOADER* 📸

📌 *Caption:* ${title.substring(0, 100)}...
📂 *Type:* ${isVideo ? "Video/Reel" : "Image/Album"}
🔢 *Total Items:* ${media.length}

*Select an option:*
1️⃣ *Download Media (Video/Image)*
2️⃣ *Download Audio (MP3)*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ`;

        // Send Preview/Menu
        const sentMsg = await conn.sendMessage(targetChat, { 
            image: { url: media[0].url }, 
            caption: caption 
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        // Selection Handling
        conn.ev.on("messages.upsert", async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const text = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const isReply = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReply) {
                await conn.sendMessage(targetChat, { react: { text: "📥", key: receivedMsg.key } });

                if (text === "1") {
                    // Download Media
                    for (let item of media) {
                        if (item.isVideo) {
                            await conn.sendMessage(targetChat, { 
                                video: { url: item.url }, 
                                caption: "✅ Downloaded by KAMRAN-MD" 
                            }, { quoted: receivedMsg });
                        } else {
                            await conn.sendMessage(targetChat, { 
                                image: { url: item.url }, 
                                caption: "✅ Downloaded by KAMRAN-MD" 
                            }, { quoted: receivedMsg });
                        }
                    }
                } else if (text === "2") {
                    // Download Audio (Using media[0] for audio extraction)
                    await conn.sendMessage(targetChat, { 
                        audio: { url: media[0].url }, 
                        mimetype: "audio/mpeg" 
                    }, { quoted: receivedMsg });
                } else {
                    reply("❌ Invalid choice! Reply with 1 or 2.");
                }

                await conn.sendMessage(targetChat, { react: { text: "✅", key: receivedMsg.key } });
            }
        });

    } catch (e) {
        console.error("IG DL Error:", e);
        reply("❌ Error: API limit reached or server down.");
    }
});
