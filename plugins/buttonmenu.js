const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');

/**
 * Helper: Upload to Catbox
 * Guaranteed to take a string path
 */
async function CatBox(filePath) {
    try {
        if (typeof filePath !== 'string') throw new Error("Invalid file path type");
        
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", fs.createReadStream(filePath));
        bodyForm.append("reqtype", "fileupload");
        
        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
            headers: bodyForm.getHeaders(),
        });
        return data; 
    } catch (err) {
        throw new Error("Cloud Upload Failed: " + err.message);
    }
}

cmd({
    pattern: "tobugil",
    alias: ["bugil"],
    desc: "AI Image processing (Path Error Fixed).",
    category: "ai",
    use: ".tobugil (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    let tempPath = null;
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!/image/.test(mime)) {
            return reply(`📸 Mana fotonya? Silakan balas gambar dengan perintah \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // --- MANUAL STREAM DOWNLOAD (Prevents Object Error) ---
        const message = q.msg || q;
        const stream = await downloadContentFromMessage(message, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // --- CREATE GUARANTEED STRING PATH ---
        const fileName = `ai_tmp_${crypto.randomBytes(4).toString('hex')}.jpg`;
        tempPath = path.join(__dirname, '..', fileName); // Path relative to root folder
        
        // Write the buffer to a real file path
        fs.writeFileSync(tempPath, buffer);

        // --- UPLOAD ---
        const directLink = await CatBox(tempPath);

        // --- API CALL ---
        const apiUrl = `https://api.baguss.xyz/api/edits/tobugil?image=${encodeURIComponent(directLink)}`;
        const response = await axios.get(apiUrl, { timeout: 90000 });

        const result = response.data.url;

        if (!result) return reply("❌ API failed to process. Try a clearer image.");

        await conn.sendMessage(from, {
            image: { url: result },
            caption: "✅ *Processed Successfully.*",
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Critical Bugil Error:", e);
        reply(`❌ *System Error:* ${e.message}`);
    } finally {
        // Safe Cleanup: Delete the temp file if it exists
        if (tempPath && typeof tempPath === 'string' && fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
            } catch (cleanupErr) {
                console.error("Cleanup Failed:", cleanupErr);
            }
        }
    }
});
