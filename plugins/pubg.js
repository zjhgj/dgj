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
            return reply(`📸 *KAMRAN-MD:* Please reply to an image.\nExample: *${prefix + command}*`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Step 1: Download Media
        const media = await quoted.download();

        // Step 2: Upload to Uguu (Because API needs URL)
        const form = new FormData();
        form.append('files[]', media, { filename: 'image.jpg' });

        const upload = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() }
        });

        if (!upload.data.files || !upload.data.files[0]) throw new Error("Upload failed.");
        const imageUrl = upload.data.files[0].url;

        // Step 3: Fetch AI Image from Zenz API
        const api = `https://api.zenzxz.my.id/ai/nanobanana?url=${encodeURIComponent(imageUrl)}`;
        
        // Hamesha 'arraybuffer' use karein taaki image data corrupt na ho
        const response = await axios.get(api, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        // Check karein agar buffer khali toh nahi
        if (buffer.length < 100) throw new Error("API returned empty image.");

        // Step 4: Send Image with fixed Caption
        await conn.sendMessage(from, {
            image: buffer,
            caption: `🍌 *NANO BANANA AI SUCCESS*\n\n✨ *Style:* Nano Banana V1\n🚀 *Powered by:* KAMRAN-MD\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Nano Error:", e);
        reply(`❌ *KAMRAN-MD Error:* Image processing failed. Please try again.`);
    }
});
        
