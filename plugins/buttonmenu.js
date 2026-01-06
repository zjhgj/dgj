const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');

/**
 * Helper: Upload to Catbox
 */
async function CatBox(filePath) {
    try {
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", fs.createReadStream(filePath));
        bodyForm.append("reqtype", "fileupload");
        
        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
            headers: bodyForm.getHeaders(),
        });
        return data; 
    } catch (err) {
        throw new Error("Cloud Upload Failed");
    }
}

cmd({
    pattern: "tobugil",
    alias: ["bugil"],
    desc: "AI Image processing (Fixed Download).",
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

        // --- MANUAL DOWNLOAD LOGIC (Bypass broken helper) ---
        const messageType = mime.split('/')[0];
        const stream = await downloadContentFromMessage(q.msg || q, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Save to a temp file
        const filename = `${crypto.randomBytes(6).toString('hex')}.jpg`;
        tempPath = path.join(__dirname, `../${filename}`);
        fs.writeFileSync(tempPath, buffer);

        // --- UPLOAD & API CALL ---
        const directLink = await CatBox(tempPath);

        const response = await axios.get(`https://api.baguss.xyz/api/edits/tobugil?image=${encodeURIComponent(directLink)}`, {
            timeout: 60000 
        });

        const result = response.data.url;

        if (!result) return reply("❌ API server error. Try again later.");

        await conn.sendMessage(from, {
            image: { url: result },
            caption: "✅ *Processed Successfully.*",
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Critical Error:", e);
        reply(`❌ *System Error:* ${e.message}`);
    } finally {
        // Cleanup temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
});
