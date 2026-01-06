const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Helper: Upload to Catbox
 */
async function CatBox(path) {
    try {
        if (!fs.existsSync(path)) throw new Error("File not found for upload.");
        
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", fs.createReadStream(path));
        bodyForm.append("reqtype", "fileupload");
        
        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
            headers: bodyForm.getHeaders(),
            timeout: 30000 // 30 seconds timeout
        });
        return data; 
    } catch (err) {
        console.error("Catbox Error:", err.message);
        throw new Error("Failed to upload image to cloud.");
    }
}

cmd({
    pattern: "tobugil",
    alias: ["bugil"],
    desc: "AI Image processing.",
    category: "ai",
    use: ".tobugil (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    let mediaPath = null;
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!/image/.test(mime)) {
            return reply(`📸 Mana fotonya? Silakan balas gambar dengan perintah \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download Media safely
        mediaPath = await conn.downloadAndSaveMediaMessage(q);

        // Upload to Catbox
        const directLink = await CatBox(mediaPath);

        // Fetch from API
        const apiUrl = `https://api.baguss.xyz/api/edits/tobugil?image=${encodeURIComponent(directLink)}`;
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Longer timeout for AI processing
        
        const result = response.data.url;

        if (!result) {
            return reply("❌ API did not return a valid result. The server might be processing slowly or is down.");
        }

        await conn.sendMessage(from, {
            image: { url: result },
            caption: "✅ *Processed Successfully.*",
            contextInfo: {
                externalAdReply: {
                    title: "AI PHOTO EDITOR",
                    body: "KAMRAN-MD SYSTEM",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    thumbnailUrl: result,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Plugin Error:", e);
        let errorMsg = e.message;
        if (e.response) errorMsg = `Server Error (${e.response.status})`;
        reply(`❌ *Error:* ${errorMsg}`);
    } finally {
        // Safe Cleanup
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }
    }
});
