//---------------------------------------------------------------------------
//           KAMRAN-MD - HD VIDEO ENHANCER
//---------------------------------------------------------------------------
//  🚀 CONVERT LOW QUALITY VIDEOS TO HD USING API-FAA
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Uploads media to CatBox for cloud processing
 */
async function uploadToCatBox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() }
        });
        return data; // Returns the public URL
    } catch (e) {
        throw new Error("Failed to upload media to cloud storage.");
    }
}

// --- COMMAND: HDVIDEO ---

cmd({
    pattern: "hdvideo",
    alias: ["hdvid", "hdrvideo", "enhancevid"],
    desc: "Convert video to HD quality using AI enhancement.",
    category: "tools",
    use: ".hdvideo (reply to a video)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Validate if the replied message is a video
        if (!/video/.test(mime)) {
            return reply(`🎥 *HD Video Enhancer*\n\nInvalid media! Please reply to a *video* with \`${prefix + command}\` to increase its quality.`);
        }

        // Reactions and Initial response
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("_📥 Processing... Your video is being enhanced to HD. Please wait a moment._");

        // Step 1: Download Video from WhatsApp
        // Using the built-in download method from your bot's framework
        const mediaBuffer = await quoted.download();
        if (!mediaBuffer) return reply("❌ Failed to download the video from WhatsApp.");

        // Step 2: Save temporarily to upload
        const tmpPath = path.join(__dirname, `tmp_hd_${Date.now()}.mp4`);
        fs.writeFileSync(tmpPath, mediaBuffer);

        // Step 3: Upload to CatBox to get a URL for the API
        const mediaUrl = await uploadToCatBox(tmpPath);
        
        // Clean up the local temp file immediately after upload
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

        // Step 4: Call HD Enhancement API
        const apiUrl = `https://api-faa.my.id/faa/hdvid?url=${encodeURIComponent(mediaUrl)}`;
        const response = await axios.get(apiUrl);
        const json = response.data;

        // Step 5: Validate API response
        if (!json.status || !json.result || !json.result.download_url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API Error:* Could not process this video. The file might be too large or the server is down.");
        }

        // Step 6: Send the enhanced HD Video back to the user
        await conn.sendMessage(from, {
            video: { url: json.result.download_url },
            caption: `🎥 *HD VIDEO ENHANCED*\n\n✅ *Status:* Successfully Remastered\n✨ *Quality:* High Definition (HD)\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD VIDEO ENHANCER",
                    body: "Enhance your video quality instantly!",
                    mediaType: 2,
                    thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/3502/3502601.png",
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        // Final Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("HD Video Enhancement Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "An unexpected error occurred during processing."}`);
    }
});
