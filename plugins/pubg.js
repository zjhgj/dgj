const { cmd } = require('../command');
const axios = require('axios');

// Auto-DL Status
let autoDL = true; 

async function aioDownload(url) {
    const res = await axios.get(
        `https://kyzoymd-downloader.vercel.app/api/download?url=${encodeURIComponent(url)}`
    );
    return res.data;
}

// --- AUTO DOWNLOAD LOGIC ---
cmd({
    on: "body" 
}, 
async (conn, mek, m, { from, body, isGroup, reply }) => {
    const targetChat = conn.decodeJid(from);

    // 1. Sabse important: Agar message BOT ne khud bheja hai to ignore karo (Loop Fix)
    if (m.key.fromMe) return; 

    // 2. Agar Auto-DL OFF hai to ignore karo
    if (!autoDL) return;

    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const links = body.match(urlRegex);

    if (!links) return;

    const url = links[0];

    // Supported Domains check
    const supported = ["tiktok.com", "facebook.com", "instagram.com", "youtube.com", "youtu.be", "fb.watch"];
    if (!supported.some(domain => url.includes(domain))) return;

    try {
        await conn.sendMessage(targetChat, { react: { text: "📥", key: m.key } });
        
        const data = await aioDownload(url);
        if (!data.success || !data.results.length) return;

        for (let r of data.results) {
            let videoUrl = r.hd_url || r.download_url;
            
            // Loop rokne ke liye caption mein link ko "text" bana diya (taake clickable na ho)
            let displayUrl = url.replace("https://", "").replace("http://", "");
            
            let caption = `✨ *AUTO DOWNLOADER* ✨\n\n`;
            caption += `📌 *Title:* ${r.title || "Media"}\n`;
            caption += `🌐 *Source:* ${displayUrl}\n\n`; 
            caption += `*LID Fix Active - KAMRAN-MD*`;

            if (videoUrl) {
                await conn.sendMessage(targetChat, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });
            }
        }
        
        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

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
    
    let input = q.toLowerCase();
    if (input === "on") {
        autoDL = true;
        return reply("✅ *Auto-Downloader ON ho gaya.*");
    } else if (input === "off") {
        autoDL = false;
        return reply("🔴 *Auto-Downloader OFF ho gaya.*");
    }
});
        
