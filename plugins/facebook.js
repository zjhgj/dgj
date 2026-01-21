const { cmd } = require('../command');
const fetch = require('node-fetch');
const axios = require('axios');

// --- Configuration & Helpers ---
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36';
const YT_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/;

async function getMetadata(url) {
    try {
        const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { headers: { 'user-agent': UA } });
        return await r.json();
    } catch { return null; }
}

async function getToken(url, type) {
    const page = type === 'mp3' ? 'button' : 'vidbutton';
    const r = await fetch(`https://v2.ytmp3.wtf/${page}/?url=${encodeURIComponent(url)}`, { headers: { 'user-agent': UA } });
    const html = await r.text();
    const cookie = r.headers.get('set-cookie') || '';
    return {
        phpsessid: cookie.match(/PHPSESSID=([^;]+)/)?.[1],
        tokenId: html.match(/'token_id':\s*'([^']+)'/)?.[1],
        validTo: html.match(/'token_validto':\s*'([^']+)'/)?.[1]
    };
}

async function startConvert(url, token, type) {
    const endpoint = type === 'mp3' ? 'convert' : 'vidconvert';
    const body = new URLSearchParams({ url, convert: 'gogogo', token_id: token.tokenId, token_validto: token.validTo });
    const r = await fetch(`https://v2.ytmp3.wtf/${endpoint}/`, {
        method: 'POST',
        headers: { 'user-agent': UA, 'cookie': `PHPSESSID=${token.phpsessid}`, 'content-type': 'application/x-www-form-urlencoded' },
        body
    });
    const j = await r.json();
    return j.jobid;
}

async function pollDownloadLink(jobid, token, type) {
    const endpoint = type === 'mp3' ? 'convert' : 'vidconvert';
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const r = await fetch(`https://v2.ytmp3.wtf/${endpoint}/?jobid=${jobid}&time=${Date.now()}`, {
            headers: { 'user-agent': UA, 'cookie': `PHPSESSID=${token.phpsessid}`, 'x-requested-with': 'XMLHttpRequest' }
        });
        const j = await r.json();
        if (j.ready && j.dlurl) return j.dlurl;
    }
    return null;
}

// --- MAIN COMMAND ---

cmd({
    pattern: "ytdl",
    alias: ["ytmp33", "ytmp4t", "play6"],
    react: "📥",
    desc: "Download YouTube Video or Audio via v2.ytmp3.wtf",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        const match = q ? q.match(YT_REGEX) : null;
        if (!match) return reply(`*Usage:* ${prefix}ytdl <youtube link>`);

        const videoUrl = `https://youtu.be/${match[1]}`;
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const meta = await getMetadata(videoUrl);
        const title = meta?.title || "YouTube Media";

        const caption = `
🚀 *YT DOWNLOADER (WTF)* 🚀

📌 *Title:* ${title}
👤 *Channel:* ${meta?.author_name || "Unknown"}

🔢 *Reply with:*
1️⃣ *Audio (MP3)*
2️⃣ *Video (MP4)*

> WHITESHADOW-MD ❤️`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` }, 
            caption: caption 
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        // Handle Reply
        conn.ev.on("messages.upsert", async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const text = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const isReply = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReply && (text === "1" || text === "2")) {
                await conn.sendMessage(from, { react: { text: "⏳", key: receivedMsg.key } });
                const type = text === "1" ? "mp3" : "mp4";

                try {
                    const token = await getToken(videoUrl, type);
                    const jobid = await startConvert(videoUrl, token, type);
                    const dlUrl = await pollDownloadLink(jobid, token, type);

                    if (!dlUrl) return reply("❌ Conversion failed or timeout!");

                    if (type === "mp3") {
                        await conn.sendMessage(from, { 
                            audio: { url: dlUrl }, 
                            mimetype: "audio/mpeg", 
                            fileName: `${title}.mp3` 
                        }, { quoted: receivedMsg });
                    } else {
                        await conn.sendMessage(from, { 
                            video: { url: dlUrl }, 
                            caption: `✅ *${title}*\n\n> © WHITESHADOW-MD`, 
                            mimetype: "video/mp4" 
                        }, { quoted: receivedMsg });
                    }
                } catch (err) {
                    reply("❌ Error: API is busy, try again later.");
                }
                await conn.sendMessage(from, { react: { text: "✅", key: receivedMsg.key } });
            }
        });

    } catch (e) {
        console.error(e);
        reply("❌ An unexpected error occurred.");
    }
});
