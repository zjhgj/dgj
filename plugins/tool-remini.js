const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const { cmd } = require("../command"); 

/**
 * Uploads a buffer to uguu.se to get a public URL.
 * @param {Buffer} buffer - The image data buffer.
 * @param {string} filename - The name to assign to the file during upload.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
async function Uguu(buffer, filename) {
  let form = new FormData();
  form.append('files[]', buffer, { filename });
  try {
    let { data } = await axios.post('https://uguu.se/upload.php', form, {
      headers: form.getHeaders(),
      timeout: 30000 // 30 seconds for upload
    });
    if (data?.files?.[0]?.url) return data.files[0].url;
    // Throw an error if the upload response is invalid
    throw new Error('Upload successful, but URL not found in response.');
  } catch (error) {
    // Catch Axios/network errors
    if (axios.isAxiosError(error)) {
        throw new Error(`Uguu Upload failed: ${error.message}`);
    }
    throw error;
  }
}

cmd({
    pattern: "hdr", // Command pattern
    alias: ["hd", "remini"], // Alternative names
    desc: "Enhances image quality using AI upscaling.", // Description
    react: '✨', // Reaction emoji
    category: 'imagehd', // Category
    premium: true, // Requires premium status
    filename: __filename
}, 
// The CMD function following your bot's signature
async (conn, m, store, { from, args, reply, usedPrefix, command, text }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    // 1. Input Validation
    if (!mime.startsWith('image/')) {
      await store.react('❌');
      return reply(`*Reply/Caption an image with .${command} [scale]*
*Available Scales*
- 1
- 4 (Default)
- 8
- 16
Example: \`${usedPrefix}${command} 8\``);
    }

    // Set processing reaction
    await store.react('⏳'); 
    
    // Determine the scale factor (default to 4 if text is not a valid number)
    let scale = parseInt(text) || 4;
    
    // Enforce valid scales and sanitize input
    if (![1, 4, 8, 16].includes(scale)) {
        scale = 4;
        await reply(`Invalid scale specified. Defaulting to ${scale}.`);
    }

    // 2. Download Media and Determine File Extension
    let media = await q.download();
    const fileInfo = await fromBuffer(media);
    const ext = fileInfo?.ext || 'png';
    
    // 3. Upload to Uguu
    let url = await Uguu(media, `image.${ext}`);
    
    // 4. Call Enhancement API
    const apiUrl = `https://api.offmonprst.my.id/api/enhancer?url=${encodeURIComponent(url)}&scale=${scale}`;
    
    const { data } = await axios.get(apiUrl, {
        timeout: 90000 // Longer timeout for heavy image processing
    });
    
    // 5. Process API Response
    if (!data?.result?.imageUrl) {
        // If the API failed to provide the URL, throw a specific error
        throw new Error(`Enhancement API response error: ${data.message || 'Image URL not found in API result.'}`);
    }

    // Send the enhanced image using the URL provided by the enhancer API
    await conn.sendMessage(m.chat, { 
        image: { url: data.result.imageUrl }, 
        caption: `✅ Successfully enhanced to ${scale}x scale.`
    }, { quoted: m });
    
    // Set success reaction
    await store.react('✅'); 
    
  } catch (e) {
    // Log error for debugging
    console.error(`HDR Command Error: ${e.message}`);
    
    let errorMsg = `❌ Failed to process image: ${e.message}`;
    if (axios.isAxiosError(e)) {
        if (e.response?.status === 500) {
            errorMsg = "❌ External Server Error (500). The enhancement API is down or failed to process the image.";
        } else if (e.code === 'ECONNABORTED') {
             errorMsg = "⏰ Request timed out (90s). Image processing took too long. Try a smaller image.";
        }
    } else if (e.message.includes('Upload failed')) {
         errorMsg = "❌ Image upload to hosting service failed. Try again later.";
    }

    // Set failure reaction and reply with error message
    await store.react('❌'); 
    reply(errorMsg);
  }
});
    
