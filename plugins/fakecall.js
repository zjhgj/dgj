const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Helper to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

cmd({
    pattern: 'adi',
    alias: ['adediti'],
    react: '🎶',
    desc: 'Upload an image to create a stylish Ad overlay (JPEG/PNG)',
    category: 'editing',
    use: '.ad <reply to image>',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        // Extract file
        const file = mek.quoted ? mek.quoted : mek;
        const mimetype = (file.mimetype || '').toString();
        if (!mimetype.startsWith('image/')) return reply('❌ Please upload a valid image (JPEG/PNG)');

        const buffer = await file.download();
        const size = formatBytes(buffer.length);

        // Determine extension
        let ext = '';
        if (mimetype.includes('jpeg')) ext = '.jpg';
        else if (mimetype.includes('png')) ext = '.png';
        else return reply('❌ Unsupported format. Use JPEG or PNG.');

        // Temporary save
        const tempPath = path.join(os.tmpdir(), 'ad_' + Date.now() + ext);
        fs.writeFileSync(tempPath, buffer);

        // Upload to Uguu
        const form = new FormData();
        form.append('files[]', fs.createReadStream(tempPath));
        const uploadRes = await axios.post('https://uguu.se/upload.php', form, {
            headers: form.getHeaders()
        });
        fs.unlinkSync(tempPath);

        if (!uploadRes.data || !uploadRes.data.files || !uploadRes.data.files[0].url) {
            throw new Error('Failed to upload image to Uguu.');
        }
        const fileUrl = uploadRes.data.files[0].url;

        // Call PopCat Ad API
        const adUrl = `https://api.popcat.xyz/v2/ad?image=${encodeURIComponent(fileUrl)}`;
        const adRes = await axios.get(adUrl, { responseType: 'arraybuffer' });

        if (!adRes || !adRes.data) return reply('❌ Failed to generate Ad image.');

        const adBuffer = Buffer.from(adRes.data, 'binary');

        // Send generated ad image with KAMRAN-MD style caption
        await conn.sendMessage(m.chat, {
            image: adBuffer,
            caption: `⬤───〔 *🎨 KAMRAN MD AD GENERATOR* 〕───⬤\n\n` +
                     `🖼 Original Size: ${size}\n` +
                     `✅ Image processed successfully!\n\n` +
                     `> © KAMRAN-MD 🔥`
        }, { quoted: mek });

    } catch (err) {
        console.error('Ad Error:', err);
        reply('⚠️ *Error:* ' + (err.message || 'Unknown error'));
    }
});
