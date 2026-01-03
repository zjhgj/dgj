const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

// --- Helper Functions ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

const HIDENG = {
  origin: 'https://imgupscaler.com',
  referer: 'https://imgupscaler.com/',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
};

const upskel = {
  upload: async (buffer, scaleRadio = 2) => {
    const form = new FormData();
    form.append('myfile', buffer, { filename: Date.now() + '.jpg', contentType: 'image/jpeg' });
    form.append('scaleRadio', scaleRadio);

    const res = await axios.post(
      'https://get1.imglarger.com/api/UpscalerNew/UploadNew',
      form,
      {
        headers: {
          ...form.getHeaders(),
          ...HIDENG
        }
      }
    );

    const jobId = res.data?.data?.code;
    if (!jobId) throw new Error('Upload failed: No Job ID received.');
    
    return jobId;
  },
  checkStatus: async (jobId, scaleRadio) => {
    const maxRetry = 15; // 15 times x 5s = 75 seconds max
    for (let i = 1; i <= maxRetry; i++) {
      const res = await axios.post(
        'https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew',
        { code: jobId, scaleRadio },
        {
          headers: {
            ...HIDENG,
            accept: 'application/json, text/plain, */*',
            'content-type': 'application/json'
          }
        }
      );

      const data = res.data?.data;
      if (data && data.status === 'success') {
        return data.downloadUrls[0];
      }
      await sleep(5000); // Wait 5 seconds before next check
    }
    throw new Error('Upscale timeout! Server is taking too long.');
  }
};

// --- Command ---
cmd({
    pattern: "upscale",
    alias: ["hd2", "enhance2", "upskel"],
    desc: "Upscale image using AI (imgupscaler)",
    category: "utility",
    react: "🚀",
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted, args }) => {
    try {
        // تصویر چیک کریں (LID Safe)
        const isQuotedImage = quoted ? (quoted.type === 'imageMessage') : false;
        const isImage = m.type === 'imageMessage';

        if (!isImage && !isQuotedImage) {
            return reply("❌ Please reply to an image or upload an image with the command.");
        }

        const scale = (args[0] === '4') ? 4 : 2; // Default 2x, can use 4x
        reply(`⏳ *AI is upscaling your image (${scale}x)...*\nThis may take up to a minute.`);

        // میڈیا ڈاؤن لوڈ کریں
        const targetMsg = quoted ? m.msg.contextInfo.quotedMessage.imageMessage : m.msg;
        const buffer = await conn.downloadMediaMessage(targetMsg);

        // پروسیسنگ شروع کریں
        const jobId = await upskel.upload(buffer, scale);
        const downloadUrl = await upskel.checkStatus(jobId, scale);

        // رزلٹ بھیجیں
        await conn.sendMessage(from, { 
            image: { url: downloadUrl }, 
            caption: `✅ *Upscaled successfully! (${scale}x)*\n- Powered by AI` 
        }, { quoted: mek });

    } catch (e) {
        console.error("Upscale Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
