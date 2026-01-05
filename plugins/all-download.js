//---------------------------------------------------------------------------
//           KAMRAN-MD - ALL-IN-ONE VIDEO DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD VIDEOS FROM MULTIPLE PLATFORMS USING AMOYSYHARE
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Core Logic for Generating Dynamic AmoyShare Headers
 */
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
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Referer': 'https://www.amoyshare.com/',
            'Origin': 'https://www.amoyshare.com',
            'amoyshare': amoyshare.generateHeader()
        };

        const response = await axios.get(url, { params, headers });
        return response.data;
    }
};

// --- COMMAND: DL ---

cmd({
    pattern: "dl",
    alias: ["alldl", "download"],
    desc: "Download videos from various platforms (TikTok, FB, IG, etc.)",
    category: "download",
    use: ".dl <link>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`📥 *All-In-One Downloader*\n\nUsage: \`${prefix + command} <video link>\`\nExample: \`${prefix + command} https://tiktok.com/xxx\``);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = 'https://line.1010diy.com/web/free-mp3-finder/urlParse';
        const data = await amoyshare.request(apiUrl, { url: q, phonydata: 'false' });

        if (!data || !data.data || !data.data.list || data.data.list.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch download links. The link might be private or unsupported.");
        }

        const videoInfo = data.data;
        // Finding the best quality video link
        const bestVideo = videoInfo.list.find(v => v.format === 'mp4') || videoInfo.list[0];

        if (!bestVideo || !bestVideo.url) {
            return reply("❌ Could not find a downloadable video stream.");
        }

        // Send Info first
        const caption = `🎬 *AIO DOWNLOADER*\n\n📌 *Title:* ${videoInfo.title || 'Video'}\n🌐 *Source:* ${videoInfo.source || 'Unknown'}\n\n*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, {
            video: { url: bestVideo.url },
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD DOWNLOADER",
                    body: videoInfo.title,
                    mediaType: 2,
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/3502/3502601.png",
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("AIO Download Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Something went wrong."}`);
    }
});
