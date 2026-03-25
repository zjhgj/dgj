const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
    pattern: "play0",
    alias: ["ytplay3", "music0"],
    desc: "Download and play music from YouTube",
    category: "download",
    use: ".play [song name]",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        // Check if user provided a search query
        if (!q) {
            await react('❌');
            return reply("💡 *Usage:* .play [song name]\nExample: `.play Faded Alan Walker` ");
        }

        await react('⏳'); // Loading reaction

        // Search for the video on YouTube
        const search = await yts(q);
        const data = search.videos[0];

        if (!data) {
            await react('❌');
            return reply("❌ *Song not found!* Please check the title.");
        }

        const url = data.url;
        
        // Fetching audio from Downloader API
        // Using NeoApis as per your previous request
        const apiUrl = `https://www.neoapis.xyz/api/downloader/ytdl?url=${encodeURIComponent(url)}&type=mp3`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.status) {
            await react('❌');
            return reply("⚠️ *API Error:* Failed to fetch the audio file.");
        }

        const downloadUrl = response.data.data.download;
        const title = response.data.data.title || data.title;

        let caption = `┏━♡━━━━━━━🪀━━━━━━━♡━┓
  🎵 *YT MUSIC DOWNLOADER* 🎵
┗━♡━━━━━━━🪀━━━━━━━♡━┛

┌────────────────────┈⊷
│ 📝 *TITLE* : ${title}
│ 🕒 *DURATION* : ${data.timestamp}
│ 👁️ *VIEWS* : ${data.views.toLocaleString()}
│ 📺 *CHANNEL* : ${data.author.name}
│ 🔗 *URL* : ${url}
└────────────────────┈⊷

> *POWERED BY KAMRAN MINI BOT*`;

        // Send thumbnail and info
        await conn.sendMessage(from, { 
            image: { url: data.thumbnail }, 
            caption: caption 
        }, { quoted: mek });

        // Send audio file
        await conn.sendMessage(from, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await react('✅'); // Success reaction

    } catch (e) {
        console.error(e);
        await react('❌');
        return reply("⚠️ *Error:* Connection timed out or API failed.");
    }
});
