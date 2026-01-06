//---------------------------------------------------------------------------
//           KAMRAN-MD - AI PHOTO EDIT (TOBUGIL)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

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
        return data; // Returns direct link
    } catch (err) {
        throw new Error("Catbox Upload Failed");
    }
}

cmd({
    pattern: "tobugil",
    alias: ["bugil", "toedit"],
    desc: "AI Image processing.",
    category: "ai",
    use: ".tobugil (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, isPremium, prefix, command }) => {
    try {
        // 1. Premium Check
        // Note: isPremium must be defined in your command handler
        if (!isPremium) return reply("❌ This command is only for Premium users.");

        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        // 2. Image Validation
        if (!/image/.test(mime)) {
            return reply(`📸 Mana fotonya? Silakan balas gambar dengan perintah \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 3. Download Media
        // Using common Baileys download pattern
        let media = await conn.downloadAndSaveMediaMessage(q);

        // 4. Upload to Catbox to get direct link
        let directLink = await CatBox(media);

        // 5. Fetch from API
        const response = await axios.get(`https://api.baguss.xyz/api/edits/tobugil?image=${directLink}`);
        const result = response.data.url;

        if (!result) throw new Error("API did not return a valid URL.");

        // 6. Send Result
        await conn.sendMessage(from, {
            image: { url: result },
            caption: "✅ *Done.*",
            contextInfo: {
                externalAdReply: {
                    title: "AI PHOTO EDITOR",
                    body: "Processed Successfully",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    thumbnailUrl: result,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // Cleanup local file
        fs.unlinkSync(media);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Something went wrong."}`);
    }
});
