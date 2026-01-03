const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');

cmd({
    pattern: "hytamkan",
    alias: ["editimage", "hytam"],
    react: "🎨",
    desc: "Edit your image using hytamkan effect.",
    category: "tools",
    filename: __filename
},           
async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // چیک کریں کہ کیا یوزر نے تصویر بھیجی ہے یا تصویر کو ریپلائی کیا ہے
        const isQuotedImage = quoted ? (quoted.type === 'imageMessage') : false;
        const isImage = m.type === 'imageMessage';

        if (!isImage && !isQuotedImage) {
            return reply("❌ Please reply to an image or upload an image with the command.");
        }

        reply("⏳ Processing your image, please wait...");

        // تصویر ڈاؤن لوڈ کریں
        const targetMsg = quoted ? m.msg.contextInfo.quotedMessage.imageMessage : m.msg;
        const buffer = await conn.downloadMediaMessage(targetMsg);
        
        // تصویر کو اپ لوڈ کرنے یا براہ راست لنک بنانے کے لیے (اکثر APIs کو URL کی ضرورت ہوتی ہے)
        // یہاں ہم فرض کر رہے ہیں کہ آپ کے پاس تصویر کو URL میں بدلنے کا فنکشن موجود ہے
        // اگر نہیں، تو ہم بوٹ کے میڈیا اپلوڈر کو استعمال کریں گے
        
        const apiUrl = `https://api.baguss.xyz/api/edits/hytamkan?image=https://telegra.ph/file/example.jpg`; 
        // نوٹ: آپ کو یہاں امیج کو کسی ہوسٹنگ (جیسے telegra.ph) پر اپ لوڈ کر کے اس کا لنک دینا ہوگا
        
        // متبادل طریقہ: اگر API براہ راست بفر سپورٹ کرتی ہے (زیادہ تر نہیں کرتی)
        // یہاں ہم صرف ایک مثال دے رہے ہیں، آپ کو امیج اپ لوڈر فنکشن استعمال کرنا ہوگا
        
        /* مثال کے طور پر:
        const imgUrl = await uploadToCloud(buffer);
        const finalApi = `https://api.baguss.xyz/api/edits/hytamkan?image=${imgUrl}`;
        */

        // فرض کریں آپ کے پاس پہلے سے ایڈٹ شدہ رزلٹ آ رہا ہے
        // ہم براہ راست API سے بفر حاصل کریں گے
        const resultBuffer = await getBuffer(`https://api.baguss.xyz/api/edits/hytamkan?image=YOUR_UPLOADED_IMAGE_URL`);

        await conn.sendMessage(from, { 
            image: resultBuffer, 
            caption: "✅ Image edited successfully!" 
        }, { quoted: mek });

    } catch (e) {
        console.error("Edit Error:", e);
        reply("❌ Failed to process the image. API might be down or image link is invalid.");
    }
});
