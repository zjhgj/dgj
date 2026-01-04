//---------------------------------------------------------------------------
//           KAMRAN-MD - FIGURA AI STYLE (V1-V3)
//---------------------------------------------------------------------------
//  🚀 TRANSFORM PHOTOS INTO PREMIUM FIGURA STYLES
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

/**
 * Upload file to Catbox.moe
 */
async function uploadCatbox(buffer) {
    const tempFile = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFile, buffer);
    
    try {
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(tempFile));

        const res = await axios.post("https://catbox.moe/user/api.php", form, {
            headers: form.getHeaders(),
        });

        fs.unlinkSync(tempFile);
        if (typeof res.data === 'string' && res.data.startsWith("https://")) {
            return res.data;
        }
        throw new Error("Catbox upload failed");
    } catch (e) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw e;
    }
}

const allEndpoints = {
    '1': { url: 'https://api-faa.my.id/faa/tofigura?url=', name: 'Figura Classic (V1)' },
    '2': { url: 'https://api-faa.my.id/faa/tofigurav2?url=', name: 'Figura Enhanced (V2)' },
    '3': { url: 'https://api-faa.my.id/faa/tofigurav3?url=', name: 'Figura Premium (V3)' }
};

cmd({
    pattern: "tofigure",
    alias: ["figura", "tofigura"],
    desc: "Transform photo into Figura style (V1-V3).",
    category: "ai",
    use: ".tofigure [1-3] (reply to photo)",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        // Check if message is a reply to an image or an image itself
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!/image\/(jpeg|jpg|png)/i.test(mime)) {
            return reply(`⚠️ Please reply to a *photo* with \`${prefix + command}\` [1-3]`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Select version (Default 1)
        let version = text?.trim() || '1';
        if (!allEndpoints[version]) version = '1';
        const apiInfo = allEndpoints[version];

        // Download Media
        const media = await q.download();
        if (!media) return reply("❌ Failed to download image.");

        // Step 1: Upload to Catbox
        const catboxUrl = await uploadCatbox(media);

        // Step 2: Request Figura API
        const apiUrl = `${apiInfo.url}${encodeURIComponent(catboxUrl)}`;
        const result = await axios.get(apiUrl, { responseType: "arraybuffer" });

        if (!result.data) throw new Error("API returned empty data.");

        // Step 3: Send Final Image
        await conn.sendMessage(from, {
            image: Buffer.from(result.data),
            caption: `✨ *KAMRAN-MD FIGURA AI*\n\n🎭 *Style:* ${apiInfo.name}\n🚀 *Status:* Success`,
            mimetype: "image/jpeg"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${err.message || "Failed to process image."}`);
    }
});
