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

        if (!q && !mime) return reply(`❌ *Usage:* Reply to image or provide URL + Prompt.`);

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let imageUrl = '';
        let prompt = q;

        // Step 1: Upload Logic
        if (mime && /image/.test(mime)) {
            const buffer = await quoted.download();
            const form = new FormData();
            form.append('files[]', buffer, { filename: 'image.jpg' });

            // Uploading to Uguu
            const upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });
            
            if (!upload.data.files?.[0]?.url) throw new Error("Upload failed at Uguu");
            imageUrl = upload.data.files[0].url;
            console.log("DEBUG: Image URL:", imageUrl);
        } else {
            const parts = q.split(' ');
            imageUrl = parts[0].trim();
            prompt = parts.slice(1).join(' ').trim();
        }

        // Step 2: API Call
        const api = `https://restapis.xrizaldev.my.id/api/ai2/editimg?image_url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;
        console.log("DEBUG: API URL:", api);
        
        const response = await axios.get(api);
        
        // Log API response for debugging
        console.log("DEBUG: API Response:", JSON.stringify(response.data));

        if (!response.data.status || !response.data.result?.output_image) {
            throw new Error(`API Response Incomplete: ${JSON.stringify(response.data)}`);
        }

        // Step 3: Send Final Image
        const finalImg = await axios.get(response.data.result.output_image, { responseType: 'arraybuffer' });
        
        await conn.sendMessage(from, {
            image: Buffer.from(finalImg.data, 'binary'),
            caption: `✅ *AI EDIT SUCCESSFUL*\n✨ *Prompt:* ${prompt}\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("DEBUG ERROR:", e.message);
        reply(`🍂 *KAMRAN-MD Debug Error:* ${e.message}`); // Ab yahan asli error dikhega
    }
});
            
