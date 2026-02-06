const { cmd } = require('../command');
const axios = require('axios');

// Auto-DL Status
let autoDL = true;

/**
 * Downloader API
 */
async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

/**
 * Convert video URL to Buffer (VERY IMPORTANT to hide link)
 */
async function getBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
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

        // Supported sites only
        const supported = [
            "tiktok.com",
            "facebook.com",
            "instagram.com",
            "youtube.com",
            "x.com",
            "open.spotify.com"
        ];
        if (!supported.some(d => url.includes(d))) return;

        const targetChat = conn.decodeJid(from);

        await conn.sendMessage(targetChat, {
            react: { text: "📥", key: m.key }
        });

        const data = await aioDownload(url);
        if (!data.success || !data.results.length) return;

        for (let r of data.results) {
            const videoUrl = r.hd_url || r.download_url;
            if (!videoUrl) continue;

            // 🔥 Convert to buffer (link hidden forever)
            const buffer = await getBuffer(videoUrl);

            const caption = `✨ *AUTO DOWNLOADER* ✨

📌 *Title:* ${r.title || "Media"}

LID Fix Active - KAMRAN-MD`;

            await conn.sendMessage(targetChat, {
                video: buffer,
                mimetype: "video/mp4",
                caption: caption,
                linkPreview: false
            }, { quoted: mek });
        }

    } catch (e) {
        console.log("AutoDL Error:", e.message);
    }
});

// ---------------- ON/OFF COMMAND ----------------
cmd({
    pattern: "autodl",
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
