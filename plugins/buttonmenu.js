const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

cmd({
    pattern: "fakecall",
    alias: ["fcall", "maker-call"],
    react: "📞",
    desc: "Create a fake WhatsApp call screen image.",
    category: "maker",
    use: ".fakecall name|time|image_url (or reply image)",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    
    // FIX: Safe Key logic to stop the 'reading key' error
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply(`*Contoh: ${usedPrefix + command} Kamran|13:46|image_url*\nAtau reply gambar dengan:\n*${usedPrefix + command} Kamran|13:46*`);

        const args = text.split('|').map(v => v.trim());
        if (args.length < 2) return reply(`*Format salah!* ⚠️\n\nGunakan format: *nama|waktu|image_url*`);

        const nama = args[0];
        const waktu = args[1];
        let image = args[2] || null;

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });

        // Handling Image (URL or Quoted)
        if (!image) {
            const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message?.imageMessage || m);
            const mime = (m.quoted ? m.quoted.mimetype : m.mimetype) || (quoted.mimetype) || "";

            if (!mime.includes("image")) return reply(`*🍂 Reply gambar atau sertakan URL gambar!*`);

            // Step 1: Download & Upload to Uguu.se
            const stream = await downloadContentFromMessage(m.quoted ? m.quoted : m.message.imageMessage, "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            const tempFile = `./tmp_call_${Date.now()}.png`;
            fs.writeFileSync(tempFile, buffer);

            const form = new FormData();
            form.append('files[]', fs.createReadStream(tempFile), 'image.png');

            const upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });

            fs.unlinkSync(tempFile); // Cleanup temp file
            
            if (!upload.data?.files?.[0]?.url) throw new Error('Upload to Uguu.se failed');
            image = upload.data.files[0].url;
        }

        // Step 2: Call Maker API
        const endpoint = `https://kayzzidgf.my.id/api/maker/fakecall?nama=${encodeURIComponent(nama)}&waktu=${encodeURIComponent(waktu)}&image=${encodeURIComponent(image)}&apikey=FreeLimit`;

        const res = await axios.get(endpoint, { responseType: 'arraybuffer' });

        if (!res.headers['content-type'].includes('image')) throw new Error('API returned non-image response');

        // Step 3: Send Final Image
        await conn.sendMessage(from, { 
            image: Buffer.from(res.data), 
            caption: `📞 *FAKE CALL CREATED*\n👤 *To:* ${nama}\n⏰ *Time:* ${waktu}\n\n> © PROVA MD ❤️` 
        }, { quoted: m });

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`*Gagal membuat fake call!* 🍂\n${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
            
