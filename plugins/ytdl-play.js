const { cmd } = require("../command");
const axios = require('axios');

// --- SCRAPER ENGINE ---
const qualityvideo = ['144', '240', '360', '720', '1080'];
const qualityaudio = ['96', '128', '256', '320'];

function convertid(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function mapaudioquality(bitrate) {
    const map = { '320': 0, '256': 1, '128': 4, '96': 5 };
    return map[String(bitrate)] || 4;
}

async function request(endpoint, data) {
    return axios.post(endpoint, data, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
            'Content-Type': 'application/json',
            'origin': 'https://cnvmp3.com',
            'referer': 'https://cnvmp3.com/v51'
        }
    });
}

async function cnvmp3(yturl, quality, format = 'mp3') {
    const youtube_id = convertid(yturl);
    if (!youtube_id) throw new Error('Invalid YouTube URL');

    const formatValue = format === 'mp4' ? 0 : 1;
    let finalQuality;

    if (formatValue === 0) {
        if (!qualityvideo.includes(String(quality))) quality = '360';
        finalQuality = parseInt(quality);
    } else {
        if (!qualityaudio.includes(String(quality))) quality = '128';
        finalQuality = mapaudioquality(quality);
    }

    // Step 1: Check Database
    const check = await request('https://cnvmp3.com/check_database.php', { youtube_id, quality: finalQuality, formatValue });
    if (check.data && check.data.success) {
        return { title: check.data.data.title, download: check.data.data.server_path };
    }

    // Step 2: Fetch Video Data
    const yturlfull = `https://www.youtube.com/watch?v=${youtube_id}`;
    const viddata = await request('https://cnvmp3.com/get_video_data.php', { url: yturlfull, token: "1234" });
    if (viddata.data.error) throw new Error(viddata.data.error);

    const title = viddata.data.title;

    // Step 3: Trigger Download/Conversion
    const download = await request('https://cnvmp3.com/download_video_ucep.php', { url: yturlfull, quality: finalQuality, title, formatValue });
    if (download.data.error) throw new Error(download.data.error);

    const finalLink = download.data.download_link;

    // Step 4: Insert back to DB for next time
    await request('https://cnvmp3.com/insert_to_database.php', { youtube_id, server_path: finalLink, quality: finalQuality, title, formatValue });

    return { title, download: finalLink };
}

// --- COMMANDS ---

cmd({
    pattern: "cnv",
    alias: ["ytv", "yta"],
    react: "📥",
    desc: "Download YouTube MP3/MP4 via Cnvmp3.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❓ *Example:* \n${prefix + command} <url>|<quality>|<format>\n\n*Example MP3:* ${prefix + command} https://youtu.be/xxx|256|mp3\n*Example MP4:* ${prefix + command} https://youtu.be/xxx|720|mp4`);

        const [url, qual, type] = q.split('|');
        const format = (type || 'mp3').toLowerCase();
        const quality = qual || (format === 'mp4' ? '360' : '128');

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        reply(`🚀 *KAMRAN-MD:* Fetching ${format.toUpperCase()} (${quality})...`);

        const result = await cnvmp3(url.trim(), quality.trim(), format);

        if (format === 'mp3') {
            await conn.sendMessage(from, { 
                audio: { url: result.download }, 
                mimetype: 'audio/mpeg',
                caption: `🎵 *${result.title}*\n🚀 *Engine:* Cnvmp3\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
            }, { quoted: m });
        } else {
            await conn.sendMessage(from, { 
                video: { url: result.download }, 
                caption: `🎬 *${result.title}*\n✨ *Quality:* ${quality}p\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
          
