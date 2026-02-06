const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");
const converter = require('../data/converter');
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

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
    pattern: "svoice",
    alias: ["pytvoice"],
    react: "🎵",
    desc: "Download song as Voice Note",
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

      await reply(`🎶 *${ytdata.title}*\n⏳ Converting to voice note...`);

      // --- Get MP3 Link ---
      const audioUrl = await fetchAudio(ytdata.url);
      if (!audioUrl) return reply("❌ Audio fetch failed!");

      const mp3 = path.join(__dirname, "song.mp3");
      const ogg = path.join(__dirname, "song.ogg");

      // --- Download MP3 ---
      const res = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(mp3);
      res.data.pipe(writer);

      writer.on("finish", () => {
        // --- Convert to OGG OPUS (PTT) ---
        exec(
          `ffmpeg -i ${mp3} -c:a libopus -b:a 128k ${ogg}`,
          async (err) => {
            if (err) return reply("❌ FFmpeg convert error!");

            await conn.sendMessage(
              from,
              {
                audio: fs.readFileSync(ogg),
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
              },
              { quoted: mek }
            );

            fs.unlinkSync(mp3);
            fs.unlinkSync(ogg);
          }
        );
      });

    } catch (e) {
      console.log(e);
      reply("⚠️ Error occurred!");
    }
  }
);
