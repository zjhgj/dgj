//---------------------------------------------------------------------------
//           KAMRAN-MD - TIKTOK DOWNLOADER (LINK FIX)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok videos (Fixed Link Detection).",
    category: "download",
    use: ".tiktok <url>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, react, prefix, command }) => {
    try {
        // 1. Link extract karne ke liye regex (taki aage-piche text ho to bhi kaam kare)
        const tiktokRegex = /(https?:\/\/(?:vm|vt|www)\.tiktok\.com\/[^\s]+)/gi;
        const match = q.match(tiktokRegex);
        
        if (!match) {
            return reply(`❌ *Link missing!* \n\nKripya sahi TikTok link dein.\nUsage: \`${prefix + command} https://vt.tiktok.com/xxxx/\``);
        }

        const cleanUrl = match[0]; // Sirf link uthayega
        await react("⏳");

        // --- STABLE API URL ---
        const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const res = response.data;

        if (!res || !res.video) {
            throw new Error("API Limit reached or Invalid URL");
        }

        const videoUrl = res.video.noWatermark || res.video.watermark;
        const title = res.title || "TikTok Video";

        // 2. Video Send Karein
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `✅ *Download Successful*\n\n🎬 *Title:* ${title}\n👤 *User:* ${res.author.nickname}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`,
        }, { quoted: mek });

        // 3. Audio Send Karein (Optional)
        if (res.music && res.music.play_url) {
            await conn.sendMessage(from, { 
                audio: { url: res.music.play_url }, 
                mimetype: "audio/mpeg", 
                ptt: false 
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error("TT Error:", e.message);
        
        // --- FALLBACK AGAR PEHLA FAIL HO ---
        try {
            const fallbackUrl = `https://api.nexray.web.id/downloader/aio?url=${encodeURIComponent(q.trim())}`;
            const fbRes = await axios.get(fallbackUrl);
            const fbData = fbRes.data.result;

            if (fbData && (fbData.url || fbData.video)) {
                await conn.sendMessage(from, {
                    video: { url: fbData.url || fbData.video },
                    caption: `✅ *Downloaded via Fallback Server*\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`,
                }, { quoted: mek });
                return await react("✅");
            }
        } catch (err2) {
            await react("❌");
            reply("❌ *Error:* Link process nahi ho pa raha hai. Shayad server down hai ya link private hai.");
        }
    }
});
