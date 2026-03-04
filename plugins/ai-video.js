const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd({
    pattern: "tobotak",
    alias: ["botak", "makebald"],
    react: "👨‍🦲",
    desc: "Make someone bald using an image or URL.",
    category: "maker",
    filename: __filename
}, async (nato, mek, m, { from, q, reply, prefix, command }) => {
    try {
        // Media detection logic
        const quotedMsg = m.quoted ? m.quoted : m;
        const mime = (quotedMsg.msg || quotedMsg).mimetype || '';

        // Agar text (URL) nahi hai aur image bhi nahi hai toh example dikhayein
        if (!q && !/image/.test(mime)) {
            return reply(`*Example:*\n\n• ${prefix + command} https://example.com/image.jpg\n• Reply to an image with ${prefix + command}`);
        }

        // Reaction using nato socket
        await nato.sendMessage(from, { react: { text: '⏳', key: m.key } });

        let imageUrl = q;

        // Agar image reply ki gayi hai toh use upload karein
        if (!q && /image/.test(mime)) {
            const media = await quotedMsg.download();
            const form = new FormData();
            form.append('files[]', media, { filename: 'image.jpg' });

            // Uguu.se par upload logic
            const upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: { ...form.getHeaders() }
            });

            if (!upload.data.files || !upload.data.files[0]) {
                throw new Error("Gagal mengunggah gambar ke server.");
            }
            imageUrl = upload.data.files[0].url;
        }

        // API Call for Tobotak
        const api = `https://api.xte.web.id/v1/maker/tobotak?url=${encodeURIComponent(imageUrl)}`;
        const res = await axios.get(api);

        if (!res.data.status) {
            return reply(`🍂 *Gagal memproses gambar.*`);
        }

        // Result bhejna
        await nato.sendMessage(from, {
            image: { url: res.data.result_url },
            caption: `👨‍🦲 *KAMRAN-MD BOTAK GENERATOR*\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await nato.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Tobotak Error:", e);
        reply(`🍂 *Terjadi kesalahan:* ${e.message}`);
    }
});

