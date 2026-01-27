const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const converter = require("../data/converter");

cmd({
    pattern: "csong",
    alias: ["channelsong", "cplay"],
    react: "🎶",
    desc: "Send YouTube song as PTT voice note to WhatsApp channel",
    category: "music",
    use: ".csong <song name>",
    filename: __filename
},
async (conn, mek, m, { q, reply, react, config }) => {
    try {
        if (!q) return reply("❌ Example:\n.csong Tum Hi Ho");

        const CHANNEL_JID = config?.CHANNEL_JID || "120363XXXXXXX@newsletter";

        await react("🎧");

        // 🔍 Search YouTube
        const search = await yts(q);
        if (!search?.videos?.length)
            return reply("❌ No results found on YouTube.");

        const video = search.videos[0];

        // ⏱ Duration limit
        const maxDuration = Number(config?.MAX_AUDIO_DURATION) || 600;
        if (video.seconds > maxDuration)
            return reply(`❌ Song too long (max ${maxDuration / 60} min).`);

        await react("⬇️");

        // 🎵 Fetch MP3
        const apiUrl = `https://zaynixapi12.vercel.app/api/ytmp3-fixed?url=${encodeURIComponent(
            video.url
        )}&apiKey=${config?.ZAYNIX_API || "zaynixapi"}`;

        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        const downloadUrl =
            data?.result?.download ||
            data?.result?.mp3 ||
            data?.url;

        if (!downloadUrl) return reply("❌ Failed to fetch audio.");

        // 🖼️ Info message
        const caption = `
🎶 *Now Playing*
━━━━━━━━━━━━━━━
🎧 *Title:* ${video.title}
👤 *Channel:* ${video.author?.name || "YouTube"}
⏱️ *Duration:* ${video.timestamp}
👁️ *Views:* ${video.views ? video.views.toLocaleString() : "N/A"}
━━━━━━━━━━━━━━━
        `.trim();

        await conn.sendMessage(CHANNEL_JID, {
            image: { url: video.thumbnail },
            caption
        });

        // 🎤 Convert to PTT using converter
        const audioBuffer = await axios.get(downloadUrl, {
            responseType: "arraybuffer"
        });

        const pttAudio = await converter.toPTT(
            Buffer.from(audioBuffer.data),
            "audio/mpeg"
        );

        await conn.sendMessage(CHANNEL_JID, {
            audio: pttAudio,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
        });

        await react("✅");

    } catch (e) {
        console.error(e);
        await react("❌");
        reply("❌ Failed to send channel song.");
    }
});
