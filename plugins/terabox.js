const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { cmd } = require("../command");

cmd({
  pattern: "hytamkan",
  alias: ["hytam", "darkedit"],
  react: '🎨',
  desc: "Apply dark/hytamkan effect to your photo",
  category: "utility",
  use: ".hytamkan [reply to image]",
  filename: __filename
}, async (client, message, { reply, quoted }) => {
  try {
    // 1. میڈیا اور میم ٹائپ چیک کریں (LID Safe)
    const quotedMsg = quoted || message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      return reply("❌ Please reply to an image to use this effect.");
    }

    await reply("⏳ Processing your image, please wait...");

    // 2. تصویر ڈاؤن لوڈ کریں
    const mediaBuffer = await quotedMsg.download();
    
    // ایکسٹینشن کا تعین
    let extension = mimeType.includes('png') ? '.png' : '.jpg';

    // 3. ٹمپریری فائل بنائیں
    const tempFilePath = path.join(os.tmpdir(), `input_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // 4. Catbox پر اپلوڈ کریں (تاکہ لنک حاصل کیا جا سکے)
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), `image${extension}`);
    form.append('reqtype', 'fileupload');

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadResponse.data;
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); // صفائی

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error("Failed to generate image link for processing.");
    }

    // 5. آپ کی فراہم کردہ API کا استعمال
    const apiUrl = `https://api.baguss.xyz/api/edits/hytamkan?image=${encodeURIComponent(imageUrl)}`;
    
    const response = await axios.get(apiUrl, { 
      responseType: 'arraybuffer',
      timeout: 90000 // 1.5 منٹ کا ٹائم آؤٹ
    });

    // 6. رزلٹ چیک کریں اور بھیجیں
    if (!response.data || response.data.length < 500) {
      throw new Error("API returned invalid data.");
    }

    await client.sendMessage(message.chat, {
      image: response.data,
      caption: "✅ *Hytamkan Effect Applied!*",
    }, { quoted: message });

  } catch (error) {
    console.error('Hytamkan Error:', error);
    await reply(`❌ Error: ${error.message || "Failed to edit image. The API might be offline."}`);
  }
});
