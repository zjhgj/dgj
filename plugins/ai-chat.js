const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd({
    pattern: "ai-editi",
    alias: ["reimage"],
    desc: "AI Image Editor using Live3D",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const isQuotedImage = m.quoted && /imageMessage/.test(m.quoted.mtype);
        const isImage = /imageMessage/.test(m.mtype);

        // Check if image is provided
        if (!isQuotedImage && !isImage) {
            return reply(`- Balas atau kirim gambar dengan prompt.\n\n*Contoh:* .${command} make it cyberpunk style`);
        }

        // Check if prompt is provided
        if (!q) {
            return reply(`Prompt belum dimasukkan. Silakan masukkan deskripsi perubahan gambarnya.`);
        }

        await reply("Wait... Sedang memproses gambar.");

        // Download Media
        const media = isQuotedImage ? m.quoted : m;
        const buffer = await conn.downloadMediaMessage(media);

        // Upload to Uguu.se
        const form = new FormData();
        form.append("files[]", buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
        });

        const { data: upload } = await axios.post("https://uguu.se/upload.php", form, {
            headers: form.getHeaders()
        });

        const fileUrl = upload.files[0].url;

        // API Call
        const apiUrl = `https://api.theresav.biz.id/ai/live3d?img=${encodeURIComponent(fileUrl)}&prompt=${encodeURIComponent(q)}&apikey=DDKta`;

        const { data: editRes } = await axios.get(apiUrl);

        if (!editRes || !editRes.status || !editRes.data || !editRes.data.image) {
            return reply("Gagal mengedit gambar. API sedang bermasalah atau limit.");
        }

        const resultImage = editRes.data.image;
        const caption = `✅ *AI IMAGE EDITOR (LIVE3D)*\n\n- *Prompt:* ${q}`;

        // Send Result
        await conn.sendMessage(from, {
            image: { url: resultImage },
            caption: caption
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("Terjadi kesalahan teknis. Pastikan API Key aktif.");
    }
});
