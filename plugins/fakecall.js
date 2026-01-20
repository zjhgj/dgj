const { cmd } = require('../command');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');

// Catbox uploader
async function uploadToCatbox(buffer, filename='file.jpg') {
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, buffer);

    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempPath), filename);
    form.append('reqtype', 'fileupload');

    try {
        const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
            headers: form.getHeaders()
        });
        fs.unlinkSync(tempPath);
        return data; // URL string
    } catch(e) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error('Catbox upload error:', e);
        return null;
    }
}

// Plugin command
cmd({
  pattern: "fakecall",
  desc: "Make fake call image (KAMRAN-MD caption)",
  category: "maker",
  react: "📞",
  use: ".fakecall Name|Duration (reply with image)",
  filename: __filename
}, async (conn, m, mek, { from, args, reply, usedPrefix, command }) => {
  try {
    if (!args[0] || !args.join(' ').includes('|')) return reply(`❗ Use *Name|Duration* format machan!\nExample: ${usedPrefix + command} Chamod|10`);

    let quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || '';
    if (!mime || !/image\/(jpeg|png)/.test(mime)) return reply('🍁 Reply to a JPG/PNG image or send image with caption command machan!');

    const mediaBuffer = await quoted.download().catch(() => null);
    if (!mediaBuffer) return reply('⚠️ Image download fail machan, try again!');

    const uploadedUrl = await uploadToCatbox(mediaBuffer, 'fakecall.jpg');
    if (!uploadedUrl) return reply('⚠️ Upload fail machan, try again later!');

    let [name, duration] = args.join(' ').split('|').map(s => s.trim());
    if (!name || !duration) return reply(`🌱 Wrong format machan!\nExample: ${usedPrefix + command} Chamod|10`);

    await reply('⏳ Working on it machan...');

    const apiUrl = `https://api.zenzxz.my.id/maker/fakecall?nama=${encodeURIComponent(name)}&durasi=${encodeURIComponent(duration)}&avatar=${encodeURIComponent(uploadedUrl)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return reply('🍂 API error machan, try again later!');

    const arrayBuffer = await res.arrayBuffer().catch(() => null);
    if (!arrayBuffer) return reply('🍂 API returned no image machan.');

    const buffer = Buffer.from(arrayBuffer);

    const caption = `✨ *KAMRAN-MD Bot* ✨
🧑‍💻 By: *WhiteShadow Team*

📌 Action: Fake Call
👤 Name: ${name}
⏰ Duration: ${duration} sec

🔗 URL: ${uploadedUrl}

> © Powered by KAMRAN-MD`;

    await conn.sendMessage(from, { image: buffer, caption }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply('🍂 Oops machan! Something went wrong making fakecall 😢');
  }
});
