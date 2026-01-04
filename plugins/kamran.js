//---------------------------------------------------------------------------
//           KAMRAN-MD - FILE HOSTING UPLOADER
//---------------------------------------------------------------------------
//  🚀 UPLOAD ANY MEDIA TO UPLIDER.MY.ID AND GET A DIRECT LINK
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const FormData = require('form-data');
const axios = require('axios');

/**
 * Core Uploading Logic for uplider.my.id
 * Works with Buffers directly for WhatsApp Bot efficiency
 */
async function uploadToUplider(buffer, fileName, mimeType) {
    try {
        const form = new FormData();
        form.append('file', buffer, {
            filename: fileName || 'file',
            contentType: mimeType || 'application/octet-stream',
        });

        const { data } = await axios.post('https://uplider.my.id/upload', form, {
            headers: {
                ...form.getHeaders(),
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
                "origin": "https://uplider.my.id/",
                "accept": "*/*"
            },
        });

        if (data && data.url) {
            return {
                status: 'success',
                url: 'https://uplider.my.id' + data.url
            };
        } else {
            throw new Error("Invalid response from upload server.");
        }
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// --- COMMAND: TOURURL / UPLOAD ---

cmd({
    pattern: "toururl",
    alias: ["upload", "host", "makeurl"],
    desc: "Upload media to a public link (uplider.my.id).",
    category: "tools",
    use: ".toururl (reply to image/video/audio)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!mime) {
            return reply(`📦 *File Uploader*\n\nPlease reply to any media (Image, Video, Audio, or Document) with \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply(`_📤 Uploading your file to the cloud, please wait..._`);

        // Download media from WhatsApp into memory (Buffer)
        const mediaBuffer = await q.download();
        if (!mediaBuffer) throw new Error("Could not download media from WhatsApp.");

        // Create a random filename based on mime type
        const ext = mime.split('/')[1] || 'bin';
        const fileName = `kamran_md_${Date.now()}.${ext}`;

        // Process Upload
        const result = await uploadToUplider(mediaBuffer, fileName, mime);

        // Send Result
        const response = `✅ *UPLOAD SUCCESSFUL*\n\n🔗 *URL:* ${result.url}\n📦 *Mime:* ${mime}\n\n*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, {
            text: response,
            contextInfo: {
                externalAdReply: {
                    title: "FILE HOSTING SERVICE",
                    body: "Your file is now live on the cloud!",
                    thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/338/338116.png",
                    sourceUrl: result.url,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Upload Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message}`);
    }
});
