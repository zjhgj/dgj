//---------------------------------------------------------------------------
//           KAMRAN-MD - AMOYSHEAR AIO DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD FROM FB, IG, TIKTOK, YT, ETC.
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

// --- AMOYSHEAR CORE LOGIC ---
const amoyshare = {
    generateHeader: () => {
        const date = new Date();
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1;
        let dd = date.getDate();

        mm = mm > 9 ? mm : "0" + mm;
        dd = dd > 9 ? dd : "0" + dd;

        const dateStr = `${yyyy}${mm}${dd}`;
        const constant = "786638952";

        const randomVal = 1000 + Math.round(8999 * Math.random());
        const key = `${dateStr}${constant}${randomVal}`;
        const hashInput = `${dateStr}${randomVal}${constant}`;
        
        const signature = crypto.createHash('md5')
            .update(hashInput)
            .digest('hex');

        return `${key}-${signature}`;
    },

    request: async (url, params = {}) => {
        const dynamicHeaders = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.amoyshare.com/',
            'Origin': 'https://www.amoyshare.com',
            'amoyshare': amoyshare.generateHeader()
        };

        const response = await axios.get(url, {
            params: params,
            headers: dynamicHeaders
        });

        return response.data;
    }
};

cmd({
    pattern: "amoyshare",
    alias: ["adl", "amoy"],
    desc: "Download videos using AmoyShare AIO platform.",
    category: "download",
    use: ".amoyshare <url>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("❌ Please provide a video URL (FB, IG, YT, etc.)");

        await react("📥");

        // Request URL parsing
        const parseUrl = 'https://line.1010diy.com/web/free-mp3-finder/urlParse';
        const data = await amoyshare.request(parseUrl, {
            url: q,
            phonydata: 'false'
        });

        if (!data || !data.data || !data.data.list || data.data.list.length === 0) {
            return reply("❌ *Error:* Could not fetch download links. The video might be private or unsupported.");
        }

        const videoInfo = data.data;
        const bestQuality = videoInfo.list.filter(v => v.type === 'video').sort((a, b) => parseInt(b.quality) - parseInt(a.quality))[0];
        
        if (!bestQuality) return reply("❌ No downloadable video found.");

        const caption = `
✅ *AIO Download Success*

📌 *Title:* ${videoInfo.title || "AmoyShare Video"}
🎬 *Quality:* ${bestQuality.quality || "Default"}
🔗 *Source:* ${q}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ
`.trim();

        // Send Video
        await conn.sendMessage(from, {
            video: { url: bestQuality.url },
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: "AMOYSHEAR DOWNLOADER",
                    body: videoInfo.title,
                    mediaType: 1,
                    sourceUrl: q,
                    thumbnailUrl: videoInfo.thumbnail,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("AmoyShare Error:", e);
        await react("❌");
        reply(`❌ *Error:* ${e.message || "Failed to process the request."}`);
    }
});
