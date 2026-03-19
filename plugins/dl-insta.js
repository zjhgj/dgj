const { cmd } = require('../command');
const axios = require('axios');

// --- INSTAGRAM DOWNLOADER ---
cmd({
    pattern: "ig",
    alias: ["instagram", "igdl"],
    desc: "Download Instagram Media.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ براہ کرم انسٹاگرام کا لنک دیں۔\nمثال: *.ig https://www.instagram.com/reel/xxx/*");
        
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Using a more reliable API for Instagram
        const response = await axios.get(`https://api.giftedtech.my.id/api/download/instagram?url=${encodeURIComponent(q)}`);
        
        if (!response.data || response.data.status !== 200) {
            // Fallback API if the first one fails
            const fbRes = await axios.get(`https://bk9.fun/download/ig?url=${q}`);
            const data = fbRes.data.BK9;
            
            if (data && data.length > 0) {
                for (let item of data) {
                    await conn.sendMessage(from, { video: { url: item.url }, caption: "✅ *Instagram Video Downloaded*" }, { quoted: m });
                }
                return await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
            }
            throw new Error("Failed");
        }

        const result = response.data.result;
        // Gifted API returns an array of media
        for (let media of result) {
            if (media.wm.includes("video") || media.url.includes(".mp4")) {
                await conn.sendMessage(from, { video: { url: media.url }, caption: "✅ *Success*" }, { quoted: m });
            } else {
                await conn.sendMessage(from, { image: { url: media.url } }, { quoted: m });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ ڈاؤن لوڈ کرنے میں دشواری ہوئی۔ لنک شاید پرائیویٹ ہے یا API ڈاؤن ہے۔");
    }
});

// --- TIKTOK DOWNLOADER ---
cmd({
    pattern: "tiktok2",
    alias: ["tt2", "ttdl2"],
    desc: "Download TikTok Video.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ ٹک ٹاک لنک فراہم کریں۔");
        
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await axios.get(`https://api.giftedtech.my.id/api/download/tiktokdl?url=${encodeURIComponent(q)}`);
        
        if (res.data.status === 200) {
            const data = res.data.result;
            await conn.sendMessage(from, { 
                video: { url: data.video_no_watermark }, 
                caption: `🎬 *${data.title}*\n\n*Knight Bot*` 
            }, { quoted: m });
            
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            throw new Error("API Error");
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply("❌ ٹک ٹاک ویڈیو نہیں مل سکی۔");
    }
});
