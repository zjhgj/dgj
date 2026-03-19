const { cmd } = require('../command'); // Aapke bot ka standard path
const axios = require("axios");

cmd({
    pattern: "ig",
    alias: ["insta", "igdl", "instagram"],
    category: "downloader",
    react: "📸",
    desc: "Download Instagram Reels, Posts, and Videos"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    
    if (!q) {
        await react("❌");
        return reply("Bhai, Instagram link toh dein!\nExample: .ig https://www.instagram.com/reel/xxx");
    }

    if (!q.includes("instagram.com")) {
        await react("❌");
        return reply("❌ Ye link Instagram ka nahi lag raha.");
    }

    await react("⏳");

    try {
        // Gifted API URL
        const apiUrl = `https://api.giftedtech.co.ke/api/download/instadl?apikey=gifted&url=${encodeURIComponent(q)}`;

        const { data } = await axios.get(apiUrl, { timeout: 45000 });

        if (!data || !data.success || !data.result?.download_url) {
            await react("❌");
            return reply("❌ Media nahi mil saka. Shayad account private hai.");
        }

        const mediaUrl = data.result.download_url;
        
        // Check if it's a video or image
        const isVideo = mediaUrl.includes(".mp4") || q.includes("/reel/") || q.includes("/tv/");

        if (isVideo) {
            // Send Video
            await conn.sendMessage(m.chat, {
                video: { url: mediaUrl },
                mimetype: "video/mp4",
                caption: `✅ *Instagram Video Downloaded*\n\n> *${botFooter || 'DR KAMRAN-MD'}*`
            }, { quoted: mek });
        } else {
            // Send Image
            await conn.sendMessage(m.chat, {
                image: { url: mediaUrl },
                caption: `✅ *Instagram Image Downloaded*\n\n> *${botFooter || 'DR KAMRAN-MD'}*`
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error("IG DL Error:", e.message);
        await react("❌");
        return reply("❌ Service busy hai: " + e.message);
    }
});
