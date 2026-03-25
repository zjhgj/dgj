const { cmd, commands } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
    pattern: "play6",
    alias: ["ytplay7", "music8", "song9"],
    desc: "Download and play music from YouTube",
    category: "download",
    use: ".play [song name]",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        // 1. Basic Validation
        if (!q) {
            await react('❓');
            return reply("❌ *Please provide a song name or YouTube link!*\n\n*Example:* .play Stay Justin Bieber");
        }

        await react('⏳');

        // 2. Search YouTube
        const search = await yts(q);
        const data = search.videos[0];

        if (!data) {
            await react('❌');
            return reply("🚫 *No results found for your search.*");
        }

        const url = data.url;
        const title = data.title;

        // 3. Prepare the Response Message
        let caption = `*🎧 KAMRAN MD BOT MUSIC* 🎧

*📝 Title:* ${title}
*🕒 Duration:* ${data.timestamp}
*👁️ Views:* ${data.views.toLocaleString()}
*📺 Channel:* ${data.author.name}
*🔗 Link:* ${url}

> *Select the format below or wait for auto-audio download.*`;

        // Send Thumbnail first
        await conn.sendMessage(from, { 
            image: { url: data.thumbnail }, 
            caption: caption 
        }, { quoted: mek });

        // 4. Download Audio using a more stable API (ytdl alternatives)
        // We will try a different API endpoint if the previous one failed
        const apiUrl = `https://api.giftedtech.my.id/api/download/ytdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.success && response.data.result) {
            const downloadUrl = response.data.result.mp3; // Checking for mp3 path

            // 5. Send Audio File
            await conn.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: mek });
            
            await react('✅');
        } else {
            // Fallback to secondary API if the first one fails
            const fallbackUrl = `https://api.dhammasepun.me/api/ytmp3?url=${encodeURIComponent(url)}`;
            const fallbackRes = await axios.get(fallbackUrl);
            
            if (fallbackRes.data.status) {
                await conn.sendMessage(from, { 
                    audio: { url: fallbackRes.data.result.url }, 
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`
                }, { quoted: mek });
                await react('✅');
            } else {
                throw new Error("API_ERROR");
            }
        }

    } catch (e) {
        console.log("Error in Play Command:", e);
        await react('❌');
        return reply("⚠️ *Download Failed!* The YouTube servers are busy or the API is currently offline. Please try again in a few minutes.");
    }
});
