const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd({
    pattern: "nanobanana",
    alias: ["nano", "banana", "aiimage"],
    react: "🍌",
    desc: "Transform your image using Nano Banana AI.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Step 1: Check if an image is provided
        if (!/image/.test(mime)) {
            return reply(`📸 *KAMRAN-MD:* Please reply to an image to use the Nano Banana AI.\nExample: *${prefix + command}*`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Step 2: Download the image
        const media = await quoted.download();

        // Step 3: Upload to Uguu.se to get a temporary URL
        // 
        const form = new FormData();
        form.append('files[]', media, { filename: 'image.jpg' });

        const upload = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() }
        });

        if (!upload.data.files || !upload.data.files[0]) {
            throw new Error("Gagal mengunggah gambar ke server uploader.");
        }

        const imageUrl = upload.data.files[0].url;

        // Step 4: Call Nano Banana AI API
        // 
        const api = `https://api.zenzxz.my.id/ai/nanobanana?url=${encodeURIComponent(imageUrl)}`;
        
        const response = await axios.get(api, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');

        // Step 5: Send the AI result back to user
        await conn.sendMessage(from, {
            image: buffer,
            caption: `🍌 *NANO BANANA AI SUCCESS*\n\n✨ *Style:* Nano Banana V1\n🚀 *Powered by:* KAMRAN-MD\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Nano Banana Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *KAMRAN-MD Error:* ${e.message || "Failed to process AI image."}`);
    }
});
    
