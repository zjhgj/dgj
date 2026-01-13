const { cmd, commands } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

/**
 * Helper to retry requests with exponential backoff
 */
async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

// API Fetchers
async function getIzumiUrl(url) {
    const res = await tryRequest(() => axios.get(`https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=mp3`, AXIOS_DEFAULTS));
    return res.data?.result?.download ? res.data.result : null;
}

async function getIzumiQuery(query) {
    const res = await tryRequest(() => axios.get(`https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(query)}`, AXIOS_DEFAULTS));
    return res.data?.result?.download ? res.data.result : null;
}

async function getOkatsuUrl(url) {
    const res = await tryRequest(() => axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`, AXIOS_DEFAULTS));
    if (res.data?.dl) {
        return { download: res.data.dl, title: res.data.title, thumbnail: res.data.thumb };
    }
    return null;
}

cmd({
    pattern: "song10",
    alias: ["play12", "ytmp33", "music2"],
    react: "🎵",
    desc: "Download high-quality audio from YouTube.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube link!\n\nExample: .song Atif Aslam - Dil Diyan Gallan");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        let video;
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            // URL provided, but we still search to get metadata (thumbnail/title)
            const search = await yts(q);
            video = search.videos[0] || { url: q, title: "YouTube Audio", thumbnail: "https://i.ibb.co/Y7m7L3K/yt.png", timestamp: "N/A" };
        } else {
            // Keyword search
            const search = await yts(q);
            if (!search || !search.videos.length) return reply("❌ No results found for your query.");
            video = search.videos[0];
        }

        // Inform user about search result
        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: `*🎵 KAMRAN-MD SONG DOWNLOADER*\n\n*📌 Title:* ${video.title}\n*⏱ Duration:* ${video.timestamp}\n*🔗 Link:* ${video.url}\n\n_📥 Downloading audio, please wait..._`
        }, { quoted: mek });

        let audioData = null;
        let errorLog = "";

        // Attempt 1: Izumi by URL
        try {
            audioData = await getIzumiUrl(video.url);
        } catch (e) { errorLog += "IzumiURL: fail; "; }

        // Attempt 2: Izumi by Query (Fallback)
        if (!audioData) {
            try {
                audioData = await getIzumiQuery(video.title || q);
            } catch (e) { errorLog += "IzumiQuery: fail; "; }
        }

        // Attempt 3: Okatsu (Last Fallback)
        if (!audioData) {
            try {
                audioData = await getOkatsuUrl(video.url);
            } catch (e) { errorLog += "Okatsu: fail; "; }
        }

        if (!audioData) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`❌ Audio extraction failed across all sources.\n\n*Debug info:* ${errorLog}`);
        }

        const finalUrl = audioData.download || audioData.dl || audioData.url;

        // Send Audio File
        await conn.sendMessage(from, {
            audio: { url: finalUrl },
            mimetype: 'audio/mpeg',
            fileName: `${(audioData.title || video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("Song Error:", err);
        reply("❌ System error occurred: " + err.message);
    }
})
