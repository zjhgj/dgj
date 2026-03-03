const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search"); // Pehle 'npm install yt-search' kar lein

const commands = ["mp3url", "ytmp3", "play", "song"]; // 'song' command bhi add kar di

commands.forEach(command => {
  cmd({
    pattern: command,
    desc: "Download YouTube audio by Name or URL",
    category: "downloader",
    react: "🎵",
    filename: __filename
  }, async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a YouTube link or Song Name.");

      let cleanUrl = q;

      // Check agar input URL nahi hai (Song Name hai)
      if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        
        // YouTube par search karein
        const search = await yts(q);
        const video = search.videos[0]; // Pehla result uthayein

        if (!video) return reply("❌ No results found for this song name.");
        cleanUrl = video.url; // Search se URL mil gayi
      } else {
        // Agar URL hai toh purana logic
        cleanUrl = q.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");
      }

      // API Call for downloading
      const apiUrl = `https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(cleanUrl)}`;
      const res = await axios.get(apiUrl, { timeout: 20000 });

      if (!res.data?.result?.status) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to fetch audio.");
      }

      const meta = res.data.result.metadata;
      const downloadUrl = res.data.result.download.url;

      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // Thumbnail aur Detail bhejna
      await conn.sendMessage(from, {
        image: { url: meta.thumbnail },
        caption: `🎶 *${meta.title}*\n\n👤 *Channel:* ${meta.author || "Unknown"}\n💽 *Quality:* MP3\n\n> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD🤍*`
      }, { quoted: mek });

      // Audio file bhejna
      await conn.sendMessage(from, {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${meta.title}.mp3`
      }, { quoted: mek });

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error(`${command} command error:`, e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply("❌ An error occurred while processing.");
    }
  });
});
