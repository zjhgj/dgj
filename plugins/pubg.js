const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd({
    pattern: "nanobanana",
    alias: ["nano", "banana"],
    react: "🍌",
    desc: "Transform your image using Nano Banana AI.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image/.test(mime)) {
            return reply(`📸 *KAMRAN-MD:* Please reply to an image to use the Nano Banana AI.`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Step 1: Download image from WhatsApp
        const media = await quoted.download();

        // Step 2: Upload image to get URL (Zenz API needs a URL)
        const form = new FormData();
        form.append('files[]', media, { filename: 'image.jpg' });

        const upload = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() }
        });

        const imageUrl = upload.data.files[0].url;

        // Step 3: Call AI API with strict arraybuffer mode
        const api = `https://api.zenzxz.my.id/ai/nanobanana?url=${encodeURIComponent(imageUrl)}`;
        const response = await axios.get(api, { responseType: 'arraybuffer' });
        
        // Convert to Buffer properly to avoid "Can't open image" error
        const finalBuffer = Buffer.from(response.data, 'binary');

        // Step 4: Send processed image         await conn.sendMessage(from, {
            image: finalBuffer,
            caption: `🍌 *NANO BANANA AI SUCCESS*\n\n✨ *Style:* Nano Banana V1\n🚀 *Powered by:* KAMRAN-MD\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Nano Banana Error:", e);
        reply(`❌ *KAMRAN-MD Error:* AI process failed. Try a different image or check API status.`);
    }
});
            
