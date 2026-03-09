const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search");

const commands = ["mp3url", "ytmp3", "audio", "song"];

commands.forEach(command => {
  cmd({
    pattern: command,
    desc: "Download YouTube audio as MP3 (Supports Text & URL)",
    category: "downloader",
    react: "🎵",
    filename: __filename
  }, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
      if (!q) return reply(`❌ *Usage:* \n${prefix + command} <song name> OR <youtube link>`);

      let videoUrl = q;

      // --- Step 1: Text to URL Conversion (Search) ---
      if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ *No results found!*");
        videoUrl = search.videos[0].url;
      }

      // Clean URL for API
      let cleanUrl = videoUrl.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");

      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // --- Step 2: Fetch Audio via Arslan API ---
      const apiUrl = `https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(cleanUrl)}`;
      const res = await axios.get(apiUrl, { timeout: 25000 });

      if (!res.data?.result?.status) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ Failed to fetch audio. API might be down.");
      }

      const meta = res.data.result.metadata;
      const downloadUrl = res.data.result.download.url;

      // --- Step 3: Send Preview Image & Info ---
      await conn.sendMessage(from, {
        image: { url: meta.thumbnail },
        caption: `
╭━━━━━━━〔 𝐘𝐓 𝐀𝐔𝐃𝐈𝐎 〕━━━━━━━┈⊷
┃
┃ 🎵 *𝗧𝗶𝘁𝗹𝗲:* ${meta.title}
┃ 👤 *𝗔𝘂𝘁𝗵𝗼𝗿:* ${meta.author || "Unknown"}
┃ 💽 *𝗤𝘂𝗮𝗹𝗶𝘁𝘆:* High Quality MP3
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━┈⊷
⚡ *Sending your audio...*

> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ🤍*`
      }, { quoted: mek });

      // --- Step 4: Send Audio File ---
      await conn.sendMessage(from, {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${meta.title}.mp3`
      }, { quoted: mek });

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error(`${command} command error:`, e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply("❌ An error occurred while processing your request.");
    }
  });
});
