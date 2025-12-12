const axios = require('axios');
const { cmd } = require('../command'); 

/**
 * Scrapes the imgeditor.co API for image-to-image generation.
 * This is an async polling function.
 * @param {Buffer} imageBuffer - The buffer of the uploaded image.
 * @param {string} prompt - The text prompt for editing the image.
 * @returns {Promise<string>} The final image URL.
 */
async function scrapeImgEditor(imageBuffer, prompt) {
  const baseApiUrl = "https://imgeditor.co/api";
  const contentType = "image/jpeg";
  
  // --- 1. Get Upload URL ---
  const infoRes = await axios.post(`${baseApiUrl}/get-upload-url`, {
    fileName: "foto.jpg",
    contentType: contentType,
    fileSize: imageBuffer.length
  }, {
    headers: { "content-type": "application/json" },
    timeout: 10000
  });

  const info = infoRes.data; // { uploadUrl: string, publicUrl: string }

  // --- 2. Upload Image Buffer ---
  await axios.put(info.uploadUrl, imageBuffer, {
    headers: { "content-type": contentType },
    timeout: 30000
  });

  // --- 3. Request Image Generation ---
  const genRes = await axios.post(`${baseApiUrl}/generate-image`, {
    prompt,
    styleId: "realistic",
    mode: "image",
    imageUrl: info.publicUrl,
    imageUrls: [info.publicUrl],
    numImages: 1,
    outputFormat: "png",
    model: "nano-banana"
  }, {
    headers: { "content-type": "application/json" },
    timeout: 15000
  });
  
  const gen = genRes.data; // { taskId: string }

  // --- 4. Poll for Status ---
  let status;
  const maxAttempts = 20; // Check up to 20 times (approx 40 seconds)
  let attempt = 0;

  while (attempt < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
    attempt++;

    const statusRes = await axios.get(`${baseApiUrl}/generate-image/status?taskId=${gen.taskId}`, {
      headers: { "accept": "*/*" },
      timeout: 10000
    });
    
    status = statusRes.data; // { status: "completed"|"processing"|..., imageUrl: string }

    if (status.status === "completed") {
      if (!status.imageUrl) {
          throw new Error("Generation complete, but no image URL was provided.");
      }
      return status.imageUrl;
    }
    
    if (status.status === "failed" || status.status === "error") {
        throw new Error(`Generation failed at API side. Status: ${status.status}`);
    }
    
    // Continue if status is "processing" or "pending"
  }
  
  // If the loop finishes without success
  throw new Error(`Generation timed out after ${maxAttempts * 2} seconds.`);
}


// --- Command Handler ---
cmd({
    pattern: "editimg",
    alias: ["editimage", "imgaiedit"],
    desc: "Edits a replied image using an AI prompt (Image-to-Image).",
    react: '🎨',
    category: 'ai',
    limit: true,
    filename: __filename
}, async (conn, m, store, { text, usedPrefix, command, reply }) => {
    
    // 1. Initial Checks
    if (!m.quoted) {
        await store.react('❌');
        return reply(`Reply gambar dan sertakan prompt (perubahan yang diinginkan).\n\nContoh: ${usedPrefix + command} jadikan gambar ini bergaya lukisan cat minyak.`);
    }

    const q = m.quoted;
    if (!/image/.test(q.mimetype)) {
        await store.react('❌');
        return reply("Hanya bisa me-reply gambar.");
    }

    if (!text) {
        await store.react('❌');
        return reply(`Sertakan prompt untuk mengedit gambar.\nContoh: ${usedPrefix + command} tambahkan mahkota emas pada objek utama.`);
    }

    const prompt = text.trim();
    
    // 2. Start Processing
    await store.react('⏳');
    let statusMessage = await reply(`⏳ Memulai proses edit gambar AI untuk prompt: *${prompt}*\n\nTahap 1/3: Mengunduh dan mengunggah gambar...`);

    try {
        // Download quoted image buffer
        const imgBuffer = await q.download();
        
        // --- 3. Run AI Scrape Logic (Upload, Generate, Poll) ---
        await conn.sendMessage(m.chat, { 
            text: `Tahap 2/3: Gambar terunggah. Meminta AI untuk mengedit...`, 
            edit: statusMessage.key 
        });

        const url = await scrapeImgEditor(imgBuffer, prompt);

        // --- 4. Send Result ---
        await conn.sendMessage(m.chat, { 
            text: `Tahap 3/3: Selesai! Mengirim gambar...`, 
            edit: statusMessage.key 
        });
        
        await conn.sendMessage(m.chat, {
            image: { url },
            caption: `✅ *Berhasil diedit!*\n\n*Prompt:* ${prompt}`
        }, { quoted: m });
        
        await store.react('✅');
        
        // Clean up status message
        setTimeout(() => {
            conn.sendMessage(m.chat, { delete: statusMessage.key }).catch(e => e);
        }, 3000);

    } catch (e) {
        await store.react('❌');
        console.error("Image Edit Command Error:", e);
        
        let errorMessage = "Terjadi kesalahan saat mengedit gambar.";
        if (e.message.includes('timeout')) {
            errorMessage = "Waktu tunggu API habis. Coba lagi.";
        } else if (e.message.includes('Generation failed')) {
            errorMessage = e.message;
        }
        
        await conn.sendMessage(m.chat, { 
            text: `❌ Error: ${errorMessage}`, 
            edit: statusMessage.key 
        });
        
        // Ensure status message is eventually deleted if possible
        setTimeout(() => {
            conn.sendMessage(m.chat, { delete: statusMessage.key }).catch(e => e);
        }, 5000);
    }
});
