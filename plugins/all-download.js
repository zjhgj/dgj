//---------------------------------------------------------------------------
//           KAMRAN-MD - MULTI-API AUTO DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 ALL-IN-ONE DOWNLOADER (YT, MP3, TIKTOK, FB, SPOTIFY)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup, reply, sender }) => {
    try {
        // Auto-DL status check (Config filter)
        if (config.AUTO_DL !== "true") return;

        const urlMatch = body.match(/\bhttps?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
        if (!urlMatch) return;

        const url = urlMatch[0];
        let apiUrl = "";
        let type = "";

        // 1. YouTube Video Detection
        if (/youtube\.com\/watch|youtu\.be/gi.test(url)) {
            apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
            type = "yt_video";
        }
        // 2. TikTok Detection
        else if (/tiktok\.com/gi.test(url)) {
            apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
            type = "tiktok";
        }
        // 3. Facebook Detection
        else if (/facebook\.com|fb\.watch/gi.test(url)) {
            apiUrl = `https://edith-apis.vercel.app/download/facebook?url=${encodeURIComponent(url)}`;
            type = "facebook";
        }
        // 4. Spotify Detection
        else if (/open\.spotify\.com/gi.test(url)) {
            apiUrl = `https://api.deline.web.id/downloader/spotifyplay?q=${encodeURIComponent(url)}`;
            type = "spotify";
        }
        // 5. YouTube MP3 (If body contains 'mp3' keyword or logic)
        if (body.toLowerCase().includes("mp3") && type === "yt_video") {
            apiUrl = `https://apis-bandaheali.vercel.app/download/ytmp3?url=${encodeURIComponent(url)}`;
            type = "yt_audio";
        }

        if (!apiUrl) return;

        // Reactive UI
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const response = await axios.get(apiUrl);
        const res = response.data;
        
        // Extract data based on different API response structures
        let downloadLink = "";
        let title = "KAMRAN-MD DOWNLOADER";

        if (type === "yt_video" || type === "yt_audio") {
            downloadLink = res.result?.url || res.data?.url || res.url;
            title = res.result?.title || res.title || "YouTube Media";
        } else if (type === "tiktok") {
            downloadLink = res.data?.main_url || res.result?.video || res.url;
        } else if (type === "facebook") {
            downloadLink = res.result?.hd || res.result?.sd || res.url;
        } else if (type === "spotify") {
            downloadLink = res.data?.url || res.result?.download;
            title = res.data?.title || "Spotify Track";
        }

        if (!downloadLink) return;

        // Sending the Media
        const isAudio = type === "yt_audio" || type === "spotify";
        
        if (isAudio) {
            await conn.sendMessage(from, { 
                audio: { url: downloadLink }, 
                mimetype: 'audio/mpeg',
                contextInfo: newsletterContext
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                video: { url: downloadLink }, 
                caption: `*🎬 Title:* ${title}\n\n*🚀 Powered by KAMRAN-MD*`,
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log("AutoDL Error:", e.message);
    }
});
