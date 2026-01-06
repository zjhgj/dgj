//---------------------------------------------------------------------------
//           KAMRAN-MD - AI PHOTO EDIT (TOBUGIL)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');

/**
 * Built-in Catbox Uploader
 * Ensures we have a string path and valid upload
 */
async function CatBox(filePath) {
    try {
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", fs.createReadStream(filePath));
        bodyForm.append("reqtype", "fileupload");
        
        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
            headers: bodyForm.getHeaders(),
        });
        return data; // Returns the direct link string
    } catch (err) {
        throw new Error("Cloud Upload Failed: " + err.message);
    }
}

cmd({
    pattern: "tobugil",
    alias: ["bugil"],
    desc: "AI Image processing (Fixed & Stable).",
    category: "ai",
    use: ".tobugil (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, isPremium, prefix, command }) => {
    let tempPath = null;
    try {
        // 1. Check Premium
        if (!isPremium) return reply("❌ This command is for Premium users only.");

        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        // 2. Validate Image
        if (!/image/.test(mime)) {
            return reply(`📸 Mana fotonya? Balas gambar dengan perintah \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 3. Manual Download (Bypasses the "FileType.fromBuffer" error)
        const message = q.msg || q;
        const stream = await downloadContentFromMessage(message, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Save to a guaranteed string path
        const fileName = `ai_${crypto.randomBytes(5).toString('hex')}.jpg`;
        tempPath = path.join(__dirname, '..', fileName); 
        fs.writeFileSync(tempPath, buffer);

        // 5. Upload to Catbox
        const directLink = await CatBox(tempPath);

        // 6. Request API
        const apiUrl = `https://api.baguss.xyz/api/edits/tobugil?image=${encodeURIComponent(directLink)}`;
        const response = await axios.get(apiUrl, { timeout: 90000 });

        if (!response.data || !response.data.url) {
            throw new Error("Gagal mendapatkan hasil dari API");
        }

        const resultUrl = response.data.url;

        // 7. Send Final Message
        await conn.sendMessage(from, {
            image: { url: resultUrl },
            caption: "✅ *Done.*",
            contextInfo: {
                externalAdReply: {
                    title: "AI PHOTO EDITOR",
                    body: "KAMRAN-MD SYSTEM",
                    mediaType: 1,
                    sourceUrl: "https://catbox.moe",
                    thumbnailUrl: resultUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Terjadi kesalahan saat memproses gambar, coba lagi nanti.\n\n*Error:* ${err.message || err}`);
    } finally {
        // Cleanup local file
        if (tempPath && fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
            } catch (e) {}
        }
    }
});
