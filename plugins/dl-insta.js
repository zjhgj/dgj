const { cmd } = require('../command');
const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ keepAlive: true });
const apiBase = "https://api.deline.my.id";

// --- INSTAGRAM DOWNLOADER COMMAND ---
cmd({
    pattern: "ig",
    alias: ["instagram", "igdl"],
    desc: "Download Instagram Media via Link.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ براہ کرم انسٹاگرام کا لنک فراہم کریں۔\nمثال: *.ig https://www.instagram.com/reels/xxx/*");
        if (!q.includes("instagram.com")) return reply("❌ یہ انسٹاگرام کا درست لنک نہیں ہے۔");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await axios.get(`${apiBase}/downloader/ig`, {
            params: { url: q },
            httpsAgent: agent,
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!res.data.status) throw new Error("API Error");

        const result = res.data.result;
        const media = result.media || {};
        const caption = `📸 *Instagram Downloader*\n\n👤 *User:* ${result.author?.username || "-"}\n📝 *Title:* ${result.title || "-"}\n\n*Downloaded by Knight Bot*`;

        // Send Videos
        if (media.videos && media.videos.length > 0) {
            for (const vid of media.videos) {
                await conn.sendMessage(from, {
                    video: { url: vid },
                    caption: caption,
                    mimetype: "video/mp4"
                }, { quoted: m });
            }
        }

        // Send Images
        if (media.images && media.images.length > 0) {
            for (const img of media.images) {
                await conn.sendMessage(from, {
                    image: { url: img },
                    caption: caption
                }, { quoted: m });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ ڈاؤن لوڈ کرنے میں دشواری ہوئی یا لنک درست نہیں ہے۔");
    }
});

// --- TIKTOK DOWNLOADER COMMAND ---
cmd({
    pattern: "tiktok2",
    alias: ["tt2", "ttdl2"],
    desc: "Download TikTok Video via Link.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ براہ کرم ٹک ٹاک کا لنک فراہم کریں۔\nمثال: *.tiktok https://vt.tiktok.com/xxx/*");
        if (!q.includes("tiktok.com")) return reply("❌ یہ ٹک ٹاک کا درست لنک نہیں ہے۔");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await axios.get(`${apiBase}/downloader/tiktok`, {
            params: { url: q },
            httpsAgent: agent,
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!res.data.status) throw new Error("API Error");

        const r = res.data.result;
        const caption = `🎬 *TikTok Downloader*\n\n📝 *Title:* ${r.title || "-"}\n👤 *Author:* ${r.author?.nickname || "-"}\n\n*Downloaded by Knight Bot*`;

        if (r.type === "video") {
            await conn.sendMessage(from, {
                video: { url: r.download },
                caption: caption,
                mimetype: "video/mp4"
            }, { quoted: m });
        } else if (r.type === "image") {
            for (let img of r.download) {
                await conn.sendMessage(from, { image: { url: img } }, { quoted: m });
            }
        }

        // Optional Audio
        if (r.music?.play_url) {
            await conn.sendMessage(from, {
                audio: { url: r.music.play_url },
                mimetype: "audio/mpeg",
                ptt: false
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ ٹک ٹاک ویڈیو ڈاؤن لوڈ نہیں ہو سکی۔");
    }
});
