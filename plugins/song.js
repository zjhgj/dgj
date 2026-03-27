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
            if (!q) return reply("❌ Please provide a YouTube link or Song Name.\nExample: .audio Brown Munde")

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } })

            let videoUrl = q;
            let searchResult;

            // Check if input is a URL or Search Text
            const isUrl = q.startsWith("http");

            if (!isUrl) {
                // Agar text hai to search karo
                const search = await yts(q);
                searchResult = search.videos[0];
                if (!searchResult) {
                    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } })
                    return reply("❌ No results found for your search.");
                }
                videoUrl = searchResult.url;
            } else {
                // Agar URL hai to metadata fetch karo
                const search = await yts(videoUrl).catch(() => null);
                searchResult = search?.videos?.[0];
            }

            // Clean URL formatting
            let cleanUrl = videoUrl.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");
            const videoId = cleanUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];

            // API Call for Downloading
            const [apiRes] = await Promise.all([
                axios.get(
                    `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(cleanUrl)}`,
                    { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }
                )
            ]);

            const result = apiRes.data?.result;
            if (!result || !result.mp3) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ Audio fetch failed. The server might be busy.");
            }

            // Metadata variables
            const title = result.title || searchResult?.title || "Audio File";
            const views = searchResult?.views ? searchResult.views.toLocaleString() : 'N/A';
            const channel = searchResult?.author?.name || 'N/A';
            const duration = searchResult?.timestamp || 'N/A';
            const thumbnail = searchResult?.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

            const caption = `🎶 *${title}*

👤 *Channel:* ${channel}
⏳ *Duration:* ${duration}
👁 *Views:* ${views}
🔗 *Link:* ${cleanUrl}

> *⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN ⚡*`;

            // 1. Send Thumbnail & Info
            if (thumbnail) {
                await conn.sendMessage(from, {
                    image: { url: thumbnail },
                    caption: caption
                }, { quoted: mek });
            }

            // 2. Send Audio File
            await conn.sendMessage(from, {
                audio: { url: result.mp3 },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } catch (e) {
            console.error(`${command} error:`, e.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            reply("❌ Error: " + e.message);
        }
    });
});
