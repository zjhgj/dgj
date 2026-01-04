//---------------------------------------------------------------------------
//           KAMRAN-MD - AI IMAGE UNBLUR / ENHANCER
//---------------------------------------------------------------------------
//  🚀 RESTORE BLURRY IMAGES TO HIGH DEFINITION (HD)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Upload image to Uguu.se for temporary hosting
 */
async function Uguu(buffer, filename) {
    try {
        let form = new FormData();
        form.append('files[]', buffer, { filename });
        
        let { data } = await axios.post('https://uguu.se/upload.php', form, { 
            headers: form.getHeaders() 
        });

        if (data?.files?.[0]?.url) {
            return data.files[0].url;
        } else {
            throw new Error('Uguu upload failed');
        }
    } catch (e) {
        throw 'Upload to server failed. Try again.';
    }
}

// --- COMMAND: UNBLUR ---

cmd({
    pattern: "unblur",
    alias: ["enhance", "remini", "hd"],
    desc: "Restore and enhance blurry images using AI.",
    category: "ai",
    use: "reply to a blurry photo",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        // Check if the media is an image
        if (!mime.startsWith('image/')) {
            return reply(`📸 Please send or reply to a *photo* with \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download image from WhatsApp
        const media = await q.download();
        if (!media) return reply("❌ Failed to download image from WhatsApp.");

        // Step 1: Upload to Uguu.se
        const extension = mime.split('/')[1] || 'jpg';
        const uploadedUrl = await Uguu(media, `temp_${Date.now()}.${extension}`);

        // Step 2: Request Unblur API
        const apiUrl = `https://api.offmonprst.my.id/api/unblur?url=${encodeURIComponent(uploadedUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result || !data.result.output) {
            throw new Error("API did not return an enhanced image.");
        }

        // Step 3: Send the Enhanced Image back
        await conn.sendMessage(from, { 
            image: { url: data.result.output },
            caption: `✨ *KAMRAN-MD AI ENHANCER*\n\n🚀 *Status:* Success\n🛠️ *Model:* Unblur v2.0\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Unblur Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || e}`);
    }
});
