//---------------------------------------------------------------------------
//           KAMRAN-MD - PLAY MUSIC TO CHANNEL (OGG CONVERT)
//---------------------------------------------------------------------------
//  🚀 SEARCH, CONVERT MP3 TO OPUS & SEND TO NEWSLETTER/CHANNEL
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Set FFMPEG path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cmd({
    pattern: "playch",
    alias: ["songch", "musicch"],
    desc: "Search music and send as voice note to channel.",
    category: "music",
    use: ".playch memories",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        if (!text) return reply(`🎵 *Music Channel Uploader*\n\nUsage: \`${prefix + command} <song name>\`\nExample: \`${prefix + command} perfect ed sheeran\``);

        // Check if IDCH is defined in global config
        const channelId = global.idch;
        if (!channelId) return reply("❌ Channel ID is not configured in `config.js` (global.idch).");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Step 1: Search Music using API
        const apiRes = await axios.get(`https://z7.veloria.my.id/download/play?q=${encodeURIComponent(text)}`);
        const apiJson = apiRes.data;

        if (!apiJson.status || !apiJson.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Song not found.");
        }

        const result = apiJson.result;

        // Step 2: Setup Temp Directory
        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tmpInput = path.join(tmpDir, `in_${Date.now()}.mp3`);
        const tmpOutput = path.join(tmpDir, `out_${Date.now()}.ogg`);

        // Step 3: Download MP3 Buffer
        const response = await axios({
            method: 'get',
            url: result.download_url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tmpInput);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Step 4: Convert to OGG Opus (Voice Note Format)
        await new Promise((resolve, reject) => {
            ffmpeg(tmpInput)
                .toFormat("ogg")
                .audioCodec("libopus")
                .on("end", resolve)
                .on("error", reject)
                .save(tmpOutput);
        });

        const converted = fs.readFileSync(tmpOutput);

        // Step 5: Send Audio to CHANNEL (LID/JID)
        await conn.sendMessage(channelId, {
            audio: converted,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
            contextInfo: {
                externalAdReply: {
                    title: result.title,
                    body: `Channel: ${result.channel} | Duration: ${result.duration}`,
                    thumbnailUrl: result.thumbnail,
                    sourceUrl: result.url,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                },
            },
        });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        reply(`✅ *Sent to Channel:* ${result.title}`);

        // Step 6: Cleanup Temp Files
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
        if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);

    } catch (e) {
        console.error("Music CH Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message}`);
    }
});
