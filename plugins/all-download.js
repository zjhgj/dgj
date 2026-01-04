//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUTO-DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 AUTOMATICALLY DETECT AND DOWNLOAD YOUTUBE VIDEOS FROM LINKS
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

/**
 * Core Logic to fetch download link from Jawad-Tech API
 */
async function getYouTubeDownload(url) {
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        if (response.data.status && response.data.result) {
            return response.data.result;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// --- COMMAND: VIDEO (Manual Mode) ---

cmd({
    pattern: "videog",
    alias: ["ytdl", "ytmpt4"],
    desc: "Manual YouTube video downloader.",
    category: "download",
    use: ".video <link>",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("❌ Please provide a YouTube link.");
    
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    const videoData = await getYouTubeDownload(text);
    
    if (!videoData || !videoData.download_url) {
        return reply("❌ Could not process this link.");
    }

    await conn.sendMessage(from, {
        video: { url: videoData.download_url },
        caption: `🎥 *Title:* ${videoData.title}\n\n*🚀 Powered by KAMRAN-MD*`
    }, { quoted: mek });
    
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
});

// --- AUTO-DL LISTENER: Detects YouTube Links ---

cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    // Regex to match YouTube and Shorts links
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;
    const match = body.match(ytRegex);

    if (match) {
        const videoUrl = match[0];
        console.log(`[AutoDL] YouTube link detected: ${videoUrl}`);

        // Small reaction to show the bot is working
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const videoData = await getYouTubeDownload(videoUrl);

        if (videoData && videoData.download_url) {
            await conn.sendMessage(from, {
                video: { url: videoData.download_url },
                caption: `🎬 *YouTube Auto-DL*\n\n📌 *Title:* ${videoData.title}\n\n*🚀 Powered by KAMRAN-MD*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: 'KAMRAN-MD',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
            
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
    }
});
