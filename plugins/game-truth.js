const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const converter = require("../data/converter"); // jahan aapka toPTT hai

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

cmd(
  {
    pattern: "vdl",
    alias: ["vplay"],
    react: "🎵",
    desc: "Song as WhatsApp Voice Note",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
      if (!q) return reply(`Usage: ${prefix}dl <song name/link>`);

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // ---- Search ----
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

      await reply(`🎶 *${ytdata.title}*\nConverting to voice note...`);

      // ---- Fetch Audio ----
      const audioUrl = await fetchAudio(ytdata.url);
      if (!audioUrl) return reply("❌ Audio fetch failed!");

      const tempPath = path.join(__dirname, "song.mp3");

      // Download file
      const res = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "arraybuffer",
      });

      fs.writeFileSync(tempPath, res.data);

      // ---- Convert to PTT using YOUR system ----
      const buffer = fs.readFileSync(audioPath);
        const fileExtension = data[matchText].split('.').pop();
        const pttAudio = await converter.toPTT(buffer, fileExtension);

        await conn.sendMessage(from, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (error) {
        console.error("AutoVoice Listener Error:", error);
    }
});
