const { cmd } = require('../command');
const axios = require('axios');

// Auto-DL Status (Default: On)
let autoDL = true; 

/**
 * AIO Downloader Core Function
 */
async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

// --- AUTO DOWNLOAD LOGIC ---
cmd({
    on: "body" // Har message par check karega
}, 
async (conn, mek, m, { from, body, isGroup, reply }) => {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const links = body.match(urlRegex);

    // Agar Auto-DL off hai ya link nahi mila, toh return kar dein
    if (!autoDL || !links) return;

    const url = links[0];
    const targetChat = conn.decodeJid(from);

    // List of supported domains to avoid downloading random links
    const supported = ["tiktok.com", "facebook.com", "instagram.com", "youtube.com", "youtu.be", "fb.watch"];
    if (!supported.some(domain => url.includes(domain))) return;

    try {
        await conn.sendMessage(targetChat, { react: { text: "📥", key: m.key } });
        
        const data = await aioDownload(url);
        if (!data.success || !data.results.length) return;

        for (let r of data.results) {
            let videoUrl = r.hd_url || r.download_url;
            let caption = `✨ *AUTO DOWNLOADER* ✨\n\n📌 *Title:* ${r.title || "Media"}\n🌐 *Source:* ${url}\n\n*LID Fix Active - KAMRAN-MD*`;

            if (videoUrl) {
                await conn.sendMessage(targetChat, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });
            }
        }
    } catch (e) {
        console.error("Auto-DL Error:", e);
    }
});

// --- ON/OFF COMMAND ---
cmd({
    pattern: "autodl",
    desc: "Turn Auto Downloader On or Off",
    category: "owner",
    use: "<on/off>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("*Usage:* .autodl on/off");
    
    if (q.toLowerCase() === "on") {
        autoDL = true;
        return reply("✅ *Auto-Downloader has been turned ON.*");
    } else if (q.toLowerCase() === "off") {
        autoDL = false;
        return reply("🔴 *Auto-Downloader has been turned OFF.*");
    } else {
        return reply("Invalid option. Use 'on' or 'off'.");
    }
});
    
