//---------------------------------------------------------------------------
//           KAMRAN-MD - TIKTOK PHOTO SEARCH / DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 FETCH ALL IMAGES FROM A TIKTOK PHOTO SLIDE POST
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktokphoto",
    alias: ["ttphoto", "tkphoto", "ttimg"],
    desc: "Search and download TikTok photo slide images.",
    category: "search",
    use: ".tiktokphoto <url or query>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`✨ *TikTok Photo Search* ✨\n\nUsage: \`${prefix + command} <tiktok_url>\`\nExample: \`${prefix + command} https://vt.tiktok.com/ZS.../\``);

        // 1. Loading Reaction
        await conn.sendMessage(from, { react: { text: "📸", key: mek.key } });
        
        // 2. Fetch Data from Nexray API
        const apiUrl = `https://api.nexray.web.id/search/tiktokphoto?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const res = response.data;

        if (!res || !res.status || !res.result) {
            return reply("❌ *Error:* Could not find any photos for this link. Make sure it is a TikTok 'Photo Mode' post.");
        }

        const photos = res.result.photos || res.result; // Handle different API response styles
        const title = res.result.title || "TikTok Photo Slide";

        if (!Array.isArray(photos) || photos.length === 0) {
            return reply("❌ *Error:* No images found in this post.");
        }

        // 3. Inform User
        reply(`✅ *Found ${photos.length} images!* Sending them now...`);

        // 4. Send all images found in the slide
        for (let i = 0; i < photos.length; i++) {
            const imageUrl = photos[i];
            
            await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: `🖼️ *Image [${i + 1}/${photos.length}]*\n📌 *Post:* ${title}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`
            }, { quoted: mek });
            
            // Small delay to avoid spamming too fast and getting banned/rate-limited
            if (photos.length > 5) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Final Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("TikTok Photo Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Failed to fetch TikTok images."}`);
    }
});
