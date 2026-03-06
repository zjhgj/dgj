const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd({
    pattern: "editimg",
    alias: ["ai-edit", "editimage"],
    react: "🎨",
    desc: "Edit image using AI prompts.",
    category: "maker",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Step 1: Input Validation
        if (!q && !mime) {
            return reply(`*Example:* ➜ Reply photo with caption: *${prefix + command}* change background to galaxy\n\n➜ Use URL: *${prefix + command}* https://url.com/img.jpg make it 3d`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let imageUrl = '';
        let prompt = '';

        // Step 2: Handle Image Source (Reply or URL)
        if (mime && /image/.test(mime)) {
            prompt = q;
            if (!prompt) return reply(`❌ *Prompt Missing:* Please provide instructions for the AI.`);

            // Download media for upload
            const buffer = await quoted.download();
            const form = new FormData();
            form.append('files[]', buffer, { filename: 'image.jpg' });

            // Using Uguu.se for temporary image link
            const upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });

            imageUrl = upload.data.files[0].url;
        } else {
            // Parse text input for URL + Prompt
            const parts = q.split(' ');
            if (parts.length < 2) return reply(`❌ *Format Wrong:* Use URL + Prompt or reply to a photo.`);
            imageUrl = parts[0].trim();
            prompt = parts.slice(1).join(' ').trim();
        }

        // Step 3: API Request to Xrizaldev AI
        const api = `https://restapis.xrizaldev.my.id/api/ai2/editimg?image_url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(api);
        const json = response.data;

        if (!json.status || !json.result.output_image) {
            throw new Error('API failed to process image');
        }

        // Step 4: Download result as Buffer to avoid "Can't open image" error
        const finalImg = await axios.get(json.result.output_image, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(finalImg.data, 'binary');

        // Step 5: Send final edited image
        await conn.sendMessage(from, {
            image: buffer,
            caption: `✅ *AI EDIT SUCCESSFUL*\n\n✨ *Prompt:* ${prompt}\n🚀 *Powered by:* KAMRAN-MD\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("EditImg Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`🍂 *KAMRAN-MD Error:* Gagal memproses permintaan AI.`);
    }
});
      
