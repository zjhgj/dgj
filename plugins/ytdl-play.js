const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search");

const commands = ["mp3url", "ytmp3", "audio", "song"];

commands.forEach(command => {
  cmd({
    pattern: command,
    desc: "Download YouTube audio as MP3 (Dual API Backup)",
    category: "downloader",
    react: "🎵",
    filename: __filename
  }, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
      if (!q) return reply(`❌ *Usage:* \n${prefix + command} <song name> OR <youtube link>`);

      let videoUrl = q;

      // --- Step 1: Text to URL Search ---
      if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ *No results found!*");
        videoUrl = search.videos[0].url;
      }

      const cleanUrl = videoUrl.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      let downloadUrl;
      let meta = {};

      // --- Step 2: Try Primary API (Arslan) ---
      try {
        const res = await axios.get(`https://arslan-apis.vercel.app/download/ytmp3?url=${encodeURIComponent(cleanUrl)}`, { timeout: 15000 });
        if (res.data?.result?.status) {
          downloadUrl = res.data.result.download.url;
          meta = res.data.result.metadata;
        }
      } catch (err) {
        console.log("Primary API Failed, trying backup...");
      }

      // --- Step 3: Try Backup API if Primary fails ---
      if (!downloadUrl) {
        try {
          const res2 = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(cleanUrl)}`, { timeout: 15000 });
          if (res2.data?.status) {
            downloadUrl = res2.data.data.url;
            meta = {
              title: res2.data.data.title,
              thumbnail: res2.data.data.thumbnail,
              author: res2.data.data.channel
            };
          }
        } catch (err) {
          throw new Error("Both APIs are currently down.");
        }
      }

      if (!downloadUrl) return reply("❌ *Error:* Could not fetch audio from any server.");

      // --- Step 4: Send Response ---
      await conn.sendMessage(from, {
        image: { url: meta.thumbnail || 'https://i.ibb.co/video-placeholder.png' },
        caption: `
╭━━━━━━━〔 𝐘𝐓 𝐀𝐔𝐃𝐈𝐎 〕━━━━━━━┈⊷
┃
┃ 🎵 *𝗧𝗶𝘁𝗹𝗲:* ${meta.title}
┃ 👤 *𝗔𝘂𝘁𝗵𝗼𝗿:* ${meta.author || "Unknown"}
┃ 💽 *𝗦𝗲𝗿𝘃𝗲𝗿:* Multi-Server Active
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━┈⊷
⚡ *Sending your audio...*

> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ🤍*`
      }, { quoted: mek });

      await conn.sendMessage(from, {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${meta.title}.mp3`
      }, { quoted: mek });

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error(`${command} command error:`, e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`❌ *Failed:* ${e.message || "An unexpected error occurred."}`);
    }
  });
});
