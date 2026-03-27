const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search");

const commands = ["mp3url", "ytmp3", "audio"];

commands.forEach(command => {
    cmd({
        pattern: command,
        desc: "Download YouTube audio by Link or Search Name",
        category: "downloader",
        react: "🎵",
        filename: __filename
    }, async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply("❌ Please provide a YouTube link or Song Name.\nExample: .ytmp3 song punjabi")

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } })

            let videoUrl = q;
            let searchResult;

            // Step 1: Check if input is a URL or Text
            const isUrl = q.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);

            if (!isUrl) {
                // Agar text hai to YouTube par search karo
                const search = await yts(q);
                searchResult = search.videos[0]; // Pehla video uthao
                
                if (!searchResult) {
                    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                    return reply("❌ No results found for your search.");
                }
                videoUrl = searchResult.url;
            } else {
                // Agar URL hai to link set karo aur metadata fetch karo
                videoUrl = isUrl[0];
                const search = await yts(videoUrl).catch(() => null);
                searchResult = search?.videos?.[0];
            }

            // Step 2: Clean the URL
            let cleanUrl = videoUrl.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");

            // Step 3: API Call to download MP3
            const apiRes = await axios.get(
                `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(cleanUrl)}`,
                { timeout: 60000 }
            );

            const result = apiRes.data?.result;
            if (!result || !result.mp3) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ Failed to download audio. Try again later.");
            }

            // Metadata info
            const title = result.title || searchResult?.title || "Audio File";
            const thumbnail = searchResult?.thumbnail || `https://img.youtube.com/vi/${cleanUrl.split('v=')[1]}/hqdefault.jpg`;

            const caption = `🚀 *KAMRAN-MD: Processing MP3...*

🎵 *Title:* ${title}
👤 *Channel:* ${searchResult?.author?.name || 'N/A'}
⏳ *Duration:* ${searchResult?.timestamp || 'N/A'}

> *⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ ⚡*`;

            // Step 4: Send Info & Audio
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: caption
            }, { quoted: mek });

            await conn.sendMessage(from, {
                audio: { url: result.mp3 },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } catch (e) {
            console.error("ERROR:", e.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            reply("❌ Error: " + e.message);
        }
    });
});
