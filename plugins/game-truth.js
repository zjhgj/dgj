const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");
const converter = require('../data/converter');

// -------- Helper --------
function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

async function fetchAudio(url) {
  try {
    const api = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);
    return data?.data?.url || null;
  } catch {
    return null;
  }
}

// -------- Command --------
cmd(
  {
    pattern: "dlv",
    alias: ["vplay"],
    react: "🎵",
    desc: "Song as WhatsApp Voice Note (PTT)",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
      if (!q) return reply(`Usage: ${prefix}dl <song name/link>`);

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // --- Search YouTube ---
      let ytdata;
      const url = normalizeYouTubeUrl(q);

      if (url) {
        const r = await yts({ videoId: url.split("v=")[1] });
        ytdata = r;
      } else {
        const s = await yts(q);
        if (!s.videos.length) return reply("❌ No results found!");
        ytdata = s.videos[0];
      }

      await reply(`🎶 *${ytdata.title}*\nSending as voice note...`);

      // --- Get Direct Audio (Already OPUS) ---
      const audioUrl = await fetchAudio(ytdata.url);
      if (!audioUrl) return reply("❌ Audio fetch failed!");

      // --- Send as PTT Voice Note ---
      await conn.sendMessage(
        from,
        {
          audio: { url: audioUrl },
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
        },
        { quoted: mek }
      );

    } catch (e) {
      console.log(e);
      reply("⚠️ Error occurred!");
    }
  }
);
