const config = require('../config');
const { cmd } = require('../command');
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

cmd({
    pattern: "csend",
    alias: ["channelsend", "cvn"],
    category: "music",
    desc: "Send YouTube song as a WhatsApp channel-playable voice note",
    use: ".csend <jid> <song name>",
    react: "🎧",
    filename: __filename
},
async (conn, mek, m, { from, reply, args, q }) => {
    const cleanUp = (...files) => {
        for (const file of files) {
            if (file && fs.existsSync(file)) fs.unlinkSync(file);
        }
    };

    try {
        if (!q || args.length < 2) {
            return reply("❌ *Invalid Usage*\n\nExample:\n.csend 120363xxxx@newsletter Tum Hi Ho");
        }

        const targetJid = args[0].trim();
        const query = args.slice(1).join(" ").trim();

        const search = await yts(query);
        if (!search?.videos?.length) {
            return reply("❌ No results found on YouTube.");
        }

        const video = search.videos[0];
        const videoDuration = Number(video.seconds) || 0;
        const maxDuration = Number(config.MAX_AUDIO_DURATION) || 600;

        if (videoDuration > maxDuration) {
            return reply(`❌ Audio too long. Max: ${Math.floor(maxDuration / 60)} mins`);
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        // API URL for downloading
        const apiUrl = `https://zaynixapi12.vercel.app/api/ytmp3-fixed?url=${encodeURIComponent(video.url)}&apiKey=${config.ZAYNIX_API || "zaynixapi"}`;
        const { data: apiRes } = await axios.get(apiUrl, { timeout: 60000 });

        const downloadUrl = apiRes?.result?.download || apiRes?.result?.url || apiRes?.url;

        if (!downloadUrl) return reply("❌ Failed to fetch MP3 from API.");

        const uid = Date.now();
        const mp3Path = path.join(__dirname, `csend_${uid}.mp3`);
        const opusPath = path.join(__dirname, `csend_${uid}.ogg`);

        const mp3Buffer = await axios.get(downloadUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(mp3Path, Buffer.from(mp3Buffer.data));

        await conn.sendMessage(from, { react: { text: '🔄', key: mek.key } });

        // Conversion Logic: MP3 to OGG (Opus) for PTT
        await new Promise((resolve, reject) => {
            ffmpeg(mp3Path)
                .noVideo()
                .audioCodec("libopus")
                .audioChannels(1)
                .audioFrequency(48000)
                .outputOptions([
                    "-application voip",
                    "-map_metadata -1"
                ])
                .format("ogg")
                .on("end", resolve)
                .on("error", reject)
                .save(opusPath);
        });

        const caption = `🎶 *Now Playing*\n━━━━━━━━━━━━━━━\n🎧 *Title:* ${video.title}\n⏱️ *Duration:* ${video.timestamp}\n\n> *Sent via ${config.BOT_NAME}*`;

        // 1. Send Thumbnail to Channel
        await conn.sendMessage(targetJid, {
            image: { url: video.thumbnail },
            caption: caption
        });

        // 2. Send Audio as PTT (Voice Note) to Channel
        await conn.sendMessage(targetJid, {
            audio: fs.readFileSync(opusPath),
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
        });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        
        cleanUp(mp3Path, opusPath);

    } catch (err) {
        console.error("csend error:", err);
        reply("❌ Error processing request. Make sure the JID is correct.");
    }
});
          
