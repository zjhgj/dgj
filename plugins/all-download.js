//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE MASTER (AUTO-DL, SEARCH, DOWNLOAD)
//---------------------------------------------------------------------------
//  🚀 ALL-IN-ONE YOUTUBE TOOL: SEARCH, MANUAL DL, AND AUTO-DL SWITCH
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const yts = require("yt-search");

// Settings storage for Auto-DL (Reset on restart)
const autoDlStatus = new Map();

/**
 * Fetch download data from API
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

// --- COMMAND: YTS (YouTube Search) ---

cmd({
    pattern: "yts2",
    alias: ["ytsearch2", "search2"],
    desc: "Search for videos on YouTube.",
    category: "search",
    use: ".yts perfect ed sheeran",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`🔍 *YouTube Search*\n\nUsage: \`${prefix + command} <query>\``);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const search = await yts(q);
        const videos = search.videos.slice(0, 10);

        if (videos.length === 0) return reply("❌ No results found.");

        let message = `🔎 *YOUTUBE SEARCH RESULTS*\n\n*Query:* ${q}\n\n`;
        videos.forEach((video, index) => {
            message += `*${index + 1}. ${video.title}*\n`;
            message += `⌚ *Duration:* ${video.timestamp} | 👁️ *Views:* ${video.views.toLocaleString()}\n`;
            message += `🔗 *Link:* ${video.url}\n\n`;
        });

        message += `*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, {
            image: { url: videos[0].thumbnail },
            caption: message,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD'
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// --- COMMAND: YT-AUTODL (On/Off Switch) ---

cmd({
    pattern: "ytdl-auto",
    alias: ["yt-auto", "autoyt"],
    desc: "Turn YouTube Auto-Download On or Off.",
    category: "config",
    use: ".yt-auto on/off",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, isAdmins, isOwner }) => {
    if (!isAdmins && !isOwner) return reply("❌ This command is for Admins/Owner only.");
    
    if (q === "on") {
        autoDlStatus.set(from, true);
        return reply("✅ *YouTube Auto-DL is now ON* for this chat.");
    } else if (q === "off") {
        autoDlStatus.set(from, false);
        return reply("❌ *YouTube Auto-DL is now OFF* for this chat.");
    } else {
        const current = autoDlStatus.get(from) ? "ON" : "OFF";
        return reply(`❓ *Usage:* \`.yt-auto on\` or \`.yt-auto off\`\n📌 *Current Status:* ${current}`);
    }
});

// --- COMMAND: VIDEO (Manual Download) ---

cmd({
    pattern: "video3",
    alias: ["ytmp4"],
    desc: "Manual YouTube downloader.",
    category: "download",
    use: ".video <link>",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("❌ Please provide a YouTube link.");
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    const videoData = await getYouTubeDownload(text);
    if (!videoData || !videoData.download_url) return reply("❌ Could not process link.");

    await conn.sendMessage(from, {
        video: { url: videoData.download_url },
        caption: `🎥 *Title:* ${videoData.title}\n\n*🚀 Powered by KAMRAN-MD*`
    }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
});

// --- AUTO-DL LISTENER ---

cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    if (!autoDlStatus.get(from)) return;

    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;
    const match = body.match(ytRegex);

    if (match) {
        const videoUrl = match[0];
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        const videoData = await getYouTubeDownload(videoUrl);

        if (videoData && videoData.download_url) {
            await conn.sendMessage(from, {
                video: { url: videoData.download_url },
                caption: `🎬 *YouTube Auto-DL*\n📌 *Title:* ${videoData.title}\n\n*🚀 Powered by KAMRAN-MD*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: 'KAMRAN-MD'
                    }
                }
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
    }
});
