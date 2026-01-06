const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Helper: Upload to Catbox
 */
async function CatBox(path) {
    try {
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", fs.createReadStream(path));
        bodyForm.append("reqtype", "fileupload");
        
        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, {
            headers: bodyForm.getHeaders(),
        });
        return data; 
    } catch (err) {
        throw new Error("Catbox Upload Failed");
    }
}

cmd({
    pattern: "tobugil",
    alias: ["bugil"],
    desc: "AI Image processing (No Premium required).",
    category: "ai",
    use: ".tobugil (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!/image/.test(mime)) {
            return reply(`📸 Mana fotonya? Silakan balas gambar dengan perintah \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download Media
        let media = await conn.downloadAndSaveMediaMessage(q);

        // Upload to Catbox
        let directLink = await CatBox(media);

        // Fetch from API
        try {
            const response = await axios.get(`https://api.baguss.xyz/api/edits/tobugil?image=${directLink}`);
            const result = response.data.url;

            if (!result) {
                return reply("❌ API did not return a result. The server might be down.");
            }

            await conn.sendMessage(from, {
                image: { url: result },
                caption: "✅ *Processed Successfully.*",
            }, { quoted: mek });

        } catch (apiErr) {
            reply("❌ API Error: " + (apiErr.response?.data?.message || "Server Busy or Offline."));
        } finally {
            // Cleanup local file
            if (fs.existsSync(media)) fs.unlinkSync(media);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
