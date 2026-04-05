const { cmd } = require("../command");
const axios = require("axios");

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD🤍*";

cmd({
    pattern: "aio",
    alias: ["dl", "all"],
    desc: "All-in-one downloader for Social Media",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a valid URL!\nExample: *.aio https://tiktok.com/xxxx*");

        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const match = q.match(urlRegex);
        if (!match) return reply("❌ Invalid URL.");

        const link = match[0].replace(/[),.]+$/, "");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API URL Construction (Theresav API logic)
        // Note: 'apikey' ki jagah apni real apikey dalein agar zarurat ho
        const apiUrl = `https://api.theresav.my.id/download/aio-v2?url=${encodeURIComponent(link)}&mode=hybrid&quality=1080&audio_quality=320k&apikey=YOUR_API_KEY`;

        const resFetch = await axios.get(apiUrl).catch(() => null);
        
        if (!resFetch || !resFetch.data || !resFetch.data.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch data. API might be down or URL not supported.");
        }

        const res = resFetch.data.result;

        // --- Handle Images / Slides (Albums) ---
        if (res.type === "image" || res.slides) {
            const images = Array.isArray(res.slides) ? res.slides : [res.download_url];
            
            for (let imgUrl of images) {
                await conn.sendMessage(from, { 
                    image: { url: imgUrl }, 
                    caption: FOOTER 
                }, { quoted: mek });
                // Thora delay taaki spam block na ho
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

        // --- Handle Video ---
        if (res.download_url) {
            await conn.sendMessage(from, {
                video: { url: res.download_url },
                caption: `✅ *Download Success*\n\n${FOOTER}`,
                mimetype: "video/mp4"
            }, { quoted: mek });
        }

        // --- Handle Audio (Optional) ---
        if (res.audio_url) {
            await conn.sendMessage(from, {
                audio: { url: res.audio_url },
                mimetype: "audio/mpeg",
                fileName: `audio.mp3`
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("AIO DL Error:", e);
        reply("❌ An unexpected error occurred.");
    }
});
