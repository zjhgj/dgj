const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;

// --- Encryption/Decryption Keys (Provided by user) ---
const KEY_MAP = {
  "enc": "GJvE5RZIxrl9SuNrAtgsvCfWha3M7NGC",
  "dec": "H3quWdWoHLX5bZSlyCYAnvDFara25FIu"
};

// --- Core Cryptography Function (Adapted for CJS/Buffer) ---
const cryptoProc = (type, data) => {
    // Keys must be exactly 32 bytes (256 bits) for aes-256-cbc.
    // IV must be 16 bytes. We use the key itself and slice for IV.
    const key = Buffer.from(KEY_MAP[type], 'utf8');
    const iv = Buffer.from(KEY_MAP[type].slice(0, 16), 'utf8');

    // Ensure key length is exactly 32 for AES-256
    if (key.length !== 32) {
        throw new Error(`Invalid key length for AES-256 (${key.length}). Must be 32.`);
    }

    const algorithm = 'aes-256-cbc';
    const cipher = (type === 'enc' ? crypto.createCipheriv : crypto.createDecipheriv)(algorithm, key, iv);
    
    let rchipher;
    if (type === 'enc') {
        rchipher = cipher.update(data, 'utf8', 'base64');
        rchipher += cipher.final('base64');
    } else {
        rchipher = cipher.update(data, 'base64', 'utf8');
        rchipher += cipher.final('utf8');
    }
    
    return rchipher;
};


// --- Core API Downloader ---
async function tiktokDl(url) {
    try {
        if (!/tiktok\.com/.test(url)) throw new Error('Invalid url.');
        
        // 1. Encrypt URL
        const encryptedData = cryptoProc('enc', url);
        
        // 2. Post to Savetik.app API
        const { data } = await axios.post('https://savetik.app/requests', {
            bdata: encryptedData
        }, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Safari/537.36',
                'Content-Type': 'application/json'
            },
            timeout: 25000
        });
        
        if (!data || data.status !== 'success') throw new Error(data.message || 'API fetch failed.');

        // 3. Decrypt Video Link
        if (!data.data) throw new Error('API se encrypted video link nahi mila.');
        
        const decryptedVideoUrl = cryptoProc('dec', data.data);

        return {
            author: data.username || 'Unknown Author',
            thumbnail: data.thumbnailUrl || null,
            video: decryptedVideoUrl,
            audio: data.mp3 || null // Audio link is often provided directly
        };
    } catch (error) {
        throw new Error(`Video link laane mein vifal rahe: ${error.message}`);
    }
}


// --- MAIN COMMAND HANDLER ---
cmd({
    pattern: "tt",
    alias: ["tt2", "tiktok"],
    desc: "Encrypted API (savetik.app) se TikTok video download karta hai.", // Downloads TikTok video using encrypted API.
    category: "download",
    react: "🔐",
    filename: __filename
}, async (conn, mek, m, { q, reply, prefix, command, from }) => {
    try {
        if (!q || !/tiktok\.com/.test(q)) {
            return reply(`❌ Kripya sahi TikTok video ka URL dein.\n\n*Udaharan:* ${prefix + command} [Link Hian]`);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply("⏳ TikTok link ko encrypt karke video link laaya jaa raha hai...");

        // 1. Perform the download process
        const videoData = await tiktokDl(q);
        
        if (!videoData.video) {
            return reply("❌ Video link decryption ke baad bhi nahi mil paya.");
        }
        
        // 2. Send the video
        const caption = `
🎬 *TikTok Downloaded* (Encrypted API)
----------------------------------------
👤 *Author:* ${videoData.author}
📌 *Title:* Unknown (API doesn't provide title)
`;

        await conn.sendMessage(from, {
            video: { url: videoData.video },
            mimetype: 'video/mp4',
            caption: caption,
            thumbnail: { url: videoData.thumbnail || 'https://i.imgur.com/empty.png' }
        }, { quoted: mek });
        
        // 3. Send audio if available
        if (videoData.audio) {
            await conn.sendMessage(from, {
                audio: { url: videoData.audio },
                mimetype: 'audio/mpeg',
                caption: '🎵 Audio Extracted',
                ptt: false,
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("TikTok Crypto Error:", e.message);
        reply(`⚠️ Download karte samay truti aayi: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
    
