const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const CONFIG = {
    audio: { ext: ["mp3", "m4a", "wav", "opus", "flac"], q: ["best", "320k", "128k"] },
    video: { ext: ["mp4"], q: ["144p", "240p", "360p", "480p", "720p", "1080p"] }
};

const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (Android)",
    referer: "https://ytmp3.gg/"
};

// ---------- POLLING ----------
const poll = async (url) => {
    const { data } = await axios.get(url, { headers });
    if (data.status === "completed") return data;
    if (data.status === "failed") throw "Convert failed";
    await new Promise(r => setTimeout(r, 1500));
    return poll(url);
};

// ---------- YT CONVERT ----------
async function ytdl(url, format, quality) {
    const type = Object.keys(CONFIG).find(k => CONFIG[k].ext.includes(format));

    const { data: meta } = await axios.get("https://www.youtube.com/oembed", {
        params: { url, format: "json" }
    });

    const payload = {
        url,
        os: "android",
        output: { type, format, ...(type === "video" && { quality }) },
        ...(type === "audio" && { audio: { bitrate: quality } })
    };

    const req = u => axios.post(`https://${u}.ytconvert.org/api/download`, payload, { headers });
    const { data } = await req("hub").catch(() => req("api"));

    const result = await poll(data.statusUrl);

    return {
        title: meta.title,
        author: meta.author_name,
        thumbnail: meta.thumbnail_url,
        downloadUrl: result.downloadUrl
    };
}

// ================= MP3 COMMAND =================
cmd({
    pattern: "song",
    desc: "Download YouTube audio",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("*Example:* .mp3 faded");

        reply("⏳ Processing...");

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("No result");

        const data = await ytdl(video.url, "mp3", "128k");

        const buffer = await axios.get(data.downloadUrl, {
            responseType: "arraybuffer"
        }).then(res => Buffer.from(res.data));

        await conn.sendMessage(m.chat, {
            image: { url: data.thumbnail },
            caption: `🎵 *${data.title}*\n👤 ${data.author}\n\n> Sending Audio`
        }, { quoted: mek });

        await conn.sendMessage(m.chat, {
            audio: buffer,
            mimetype: "audio/mpeg"
        }, { quoted: mek });

    } catch (e) {
        reply("Error: " + e);
    }
});

// ================= MP4 COMMAND =================
cmd({
    pattern: "ytmp4",
    desc: "Download YouTube video",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("*Example:* .mp4 faded");

        reply("⏳ Processing...");

        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("No result");

        const data = await ytdl(video.url, "mp4", "720p");

        const buffer = await axios.get(data.downloadUrl, {
            responseType: "arraybuffer"
        }).then(res => Buffer.from(res.data));

        await conn.sendMessage(m.chat, {
            video: buffer,
            mimetype: "video/mp4",
            caption: `🎬 *${data.title}*\n👤 ${data.author}`
        }, { quoted: mek });

    } catch (e) {
        reply("Error: " + e);
    }
});
