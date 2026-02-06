const { cmd } = require('../command');
const axios = require('axios');
const ytdl = require('ytdl-core');

// ---------------- SETTINGS ----------------
let autoDL = true;

// ---------------- API Downloader (TT/FB/IG) ----------------
async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

// ---------------- BUFFER HELPER ----------------
async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}

// ---------------- YOUTUBE BUFFER ----------------
async function ytBuffer(url) {
    const stream = ytdl(url, { quality: '18' }); // mp4 safe
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

// ---------------- X / TWITTER BUFFER ----------------
async function twitterBuffer(url) {
    const fixed = url
        .replace('x.com', 'fxtwitter.com')
        .replace('twitter.com', 'fxtwitter.com');

    const res = await axios.get(fixed);
    const match = res.data.match(/https:\/\/video\.fxtwitter\.com\/[^"]+/);

    if (!match) throw new Error('Twitter video not found');

    return getBuffer(match[0]);
}

// ---------------- AUTO DOWNLOAD ----------------
cmd({
    on: "body"
},
async (conn, mek, m, { from, body }) => {
    try {
        if (!autoDL || !body) return;

        const urlRegex = /https?:\/\/[^\s]+/gi;
        const links = body.match(urlRegex);
        if (!links) return;

        const url = links[0];
        const targetChat = conn.decodeJid(from);

        // Supported domains
        const supported = [
            "tiktok.com",
            "facebook.com",
            "instagram.com",
            "fb.watch",
            "youtube.com",
            "youtu.be",
            "x.com",
            "twitter.com"
        ];
        if (!supported.some(d => url.includes(d))) return;

        await conn.sendMessage(targetChat, {
            react: { text: "📥", key: m.key }
        });

        let buffer;
        let caption = `✨ *AUTO DOWNLOADER* ✨\n\n`;

        // -------- YouTube --------
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            buffer = await ytBuffer(url);
            caption += "🎬 *YouTube Video*";
        }

        // -------- X / Twitter --------
        else if (url.includes('x.com') || url.includes('twitter.com')) {
            buffer = await twitterBuffer(url);
            caption += "🐦 *Twitter/X Video*";
        }

        // -------- TikTok / FB / IG --------
        else {
            const data = await aioDownload(url);
            if (!data.success || !data.results.length) return;

            const r = data.results[0];
            const videoUrl = r.hd_url || r.download_url;

            buffer = await getBuffer(videoUrl);
            caption += `📌 *${r.title || "Media"}*`;
        }

        await conn.sendMessage(targetChat, {
            video: buffer,
            mimetype: "video/mp4",
            caption,
            linkPreview: false
        }, { quoted: mek });

    } catch (e) {
        console.log("AutoDL Error:", e.message);
    }
});

// ---------------- ON / OFF COMMAND ----------------
cmd({
    pattern: "autodll",
    desc: "Turn Auto Downloader On/Off",
    category: "owner",
    use: ".autodl on/off",
    filename: __filename
},
async (conn, mek, m, { q, reply }) => {
    if (!q) return reply("*Usage:* .autodl on/off");

    if (q.toLowerCase() === "on") {
        autoDL = true;
        return reply("✅ Auto Downloader Turned ON");
    }

    if (q.toLowerCase() === "off") {
        autoDL = false;
        return reply("🔴 Auto Downloader Turned OFF");
    }

    reply("Use only: on / off");
});
