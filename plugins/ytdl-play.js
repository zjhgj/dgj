const { cmd } = require('../command');
const fetch = require("node-fetch");
const yts = require("yt-search");
const axios = require("axios");

cmd({
    pattern: "song",
    alias: ["ytmp3", "play"],
    react: "🎵",
    desc: "YouTube search & MP3 play",
    category: "download",
    use: ".play ",
    filename: __filename
},
async (arslan, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) return reply("❌ Please Provide Me A song Query or Link");

        await arslan.sendMessage(from, { react: { text: "⏳", key: m.key } });

        /* 🔍 YouTube Search */
        const search = await yts(query);
        if (!search.videos || !search.videos.length) {
            return reply("❌ No result Found");
        }

        const video = search.videos[0];

        /* 🎧 MP3 API */
        const apiUrl = `https://arslan-apis.vercel.app/download/ytmp3?url=${video.url}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data || !res.data.status || !res.data.result || !res.data.result.download || !res.data.result.download.url) {
            return reply("❌ Audio Not Generated");
        }

        const dlUrl = res.data.result.download.url;
        const meta = res.data.result.metadata;
        const quality = res.data.result.download.quality || "128kbps";

        /* 🎵 SEND AUDIO */
        await arslan.sendMessage(from, {
            audio: { url: dlUrl },
            mimetype: "audio/mpeg",
            ptt: false,
            fileName: `${meta.title || "song"}.mp3`,
            caption: `🎵 *${meta.title || "Unknown Title"}*\n🎚️ Quality: ${quality}\n\n> © KAMRAN-MD`,
            contextInfo: {
                externalAdReply: {
                    title: meta.title ? meta.title.substring(0, 40) : "YouTube Song",
                    body: "YouTube MP3",
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: video.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // ✅ FIX: Yahan 'conn' ki jagah 'arslan' use karein
        await arslan.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("PLAY ERROR:", err);
        // ❌ FIX: Yahan bhi 'conn' ki jagah 'arslan' use karein
        reply("❌ Error Found Please Try Later");
        await arslan.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
         
