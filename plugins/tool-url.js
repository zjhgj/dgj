const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const { cmd } = require('../command');

/**
 * Core Uploader Function
 */
async function uploadAmyura(filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
        '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.zip': 'application/zip',
        '.ogg': 'audio/ogg',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), { filename, contentType });

    const res = await axios.post('https://uploader.amyuracp.my.id/upload', form, {
        headers: {
            ...form.getHeaders(),
            'origin': 'https://uploader.amyuracp.my.id',
            'referer': 'https://uploader.amyuracp.my.id/',
            'accept': 'application/json',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30000,
    });

    // Extracting URL from response
    const data = res.data;
    const url = data?.url || data?.file_url || data?.link || data?.files;
    
    if (url) return url.startsWith('http') ? url : `https://uploader.amyuracp.my.id${url}`;
    
    // Fallback regex matching
    const raw = JSON.stringify(data);
    const urlMatch = raw.match(/https:\/\/uploader\.amyuracp\.my\.id\/[^\s"'<]+/);
    if (!urlMatch) throw new Error("URL not found in response.");
    return urlMatch[0];
}

// --- Bot Command ---

cmd({
    pattern: "amyura",
    alias: ["upload", "tourl", "host"],
    react: "☁️",
    desc: "Upload media (Image/Video/Audio/Doc) to Amyura Cloud and get a permanent link.",
    category: "tools",
    filename: __filename
},           
async (conn, mek, m, { from, reply, quoted }) => {
    let mediaPath;
    try {
        // 1. Check if there is media to upload
        if (!quoted) return reply("⚠️ Please reply to an image, video, audio, or document to upload.");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // 2. Download Media
        const mediaBuffer = await quoted.download();
        const fileName = `amyura_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        mediaPath = path.join('tmp', fileName);
        
        // Ensure tmp directory exists
        if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
        
        fs.writeFileSync(mediaPath, mediaBuffer);

        // 3. Upload to Amyura
        const resultUrl = await uploadAmyura(mediaPath);

        // 4. Send Success Message
        const caption = `✅ *UPLOAD SUCCESS*\n\n` +
                        `🔗 *Link:* ${resultUrl}\n` +
                        `📂 *Format:* ${path.extname(mediaPath).toUpperCase()}\n\n` +
                        `*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

        await reply(caption);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("Upload Error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *Upload Failed:* ${error.message || "Server Error"}`);
    } finally {
        // 5. Cleanup: Delete local file
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }
    }
});
