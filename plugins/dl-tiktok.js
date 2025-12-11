const { cmd } = require('../command');
const axios = require('axios');
const Buffer = require('buffer').Buffer;
// const { toPTT } = require('../function/converter.js'); // NOTE: Removed unsupported external function
// Global config is assumed to be available
const config = require('../config'); 

// --- API Endpoints ---
const DOWNLOAD_API = `https://www.restwave.my.id/download/tiktok?url=`; // User's requested API

let handler = async (conn, mek, m, { q, reply, usedPrefix, command, from, args }) => {
    
    const url = args[0] || q; // Get URL from q or args[0]

    if (!url || !url.match(/tiktok\.com|vt\.tiktok/)) 
        return reply(`❌ Kripya TikTok link dein!\n\n*Udaharan:* ${usedPrefix + command} https://vt.tiktok.com/ZS8abc123/`);

    await conn.sendMessage(from, { react: { text: "⏱️", key: m.key } });
    await reply('⏳ Video aur Audio data laaya jaa raha hai...');

    try {
        // 1. Fetch data from the API
        const { data } = await axios.get(`https://www.restwave.my.id/download/tiktok?url=${encodeURIComponent(url)}`, { timeout: 25000 });

        if (!data.status || !data.result) throw new Error('API ERROR: Link invalid hai ya server error.');

        const res = data.result.data || data.result;

        const videoUrl = res.hdplay || res.wmplay || res.play || res.video;
        const musicUrl = res.music;

        const caption = `
*🎬 TIKTOK DOWNLOADED*
----------------------------------------
ᴜsᴇʀ : ${res.author?.nickname || 'N/A'} (@${res.author?.unique_id || 'N/A'})
ᴊᴜᴅᴜʟ : ${res.title?.trim() || 'No Title'}
❤️ : ${Number(res.digg_count).toLocaleString('en-US') || 0}
💬 : ${Number(res.comment_count).toLocaleString('en-US') || 0}
🔗 : ${url}
`;
        
        // --- 2. Send Video ---
        if (videoUrl) {
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: 'video/mp4',
                fileName: `tiktok_${res.author?.unique_id}.mp4`
            }, { quoted: mek });
        } else {
            await reply('⚠️ Video link uplabdh nahi hai.');
        }

        // --- 3. Send Audio (Standard MP3, as PTT converter is removed) ---
        if (musicUrl) {
            const audioBuffer = (await axios.get(musicUrl, { responseType: 'arraybuffer' })).data;

            await conn.sendMessage(m.chat, {
                audio: Buffer.from(audioBuffer),
                mimetype: 'audio/mpeg',
                // PTT (Voice Note) removed for stability. Sending as standard audio.
                ptt: false, 
                fileName: `music_${res.author?.unique_id}.mp3`,
                caption: '🎵 Audio Extracted'
            }, { quoted: mek });
        } else {
             await reply('⚠️ Audio link bhi uplabdh nahi hai.');
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('TikTok TT Error:', e);
        m.reply(`❌ Download fail ho gaya: ${e.message}. Link check karein ya server error hai.`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
}

// Final command properties
cmd({
    pattern: "tt",
    alias: ["tiktok", "tiktok2"],
    help: ['tiktok <url>'],
    tags: ['download'],
    command: /^(tiktok|tt|tik)$/i,
    limit: true,
    filename: __filename
}, handler);

module.exports = handler;
          
