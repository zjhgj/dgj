//---------------------------------------------------------------------------
//           KAMRAN-MD - VIDER AI IMAGE GENERATOR
//---------------------------------------------------------------------------
//  🎨 GENERATE HIGH-QUALITY AI IMAGES USING VIDER.AI
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

/**
 * Creates an image generation task on Vider.ai
 */
async function viderAiTask(prompt) {
    const { data } = await axios.post('https://api.vider.ai/api/freev1/task_create/free-ai-image-generator', {
        params: {
            model: "free-ai-image-generator",
            image: "",
            aspectRatio: 1,
            prompt: prompt
        }
    }, {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "content-type": "application/json",
            "accept": "*/*",
            "origin": "https://vider.ai"
        }
    });
    return data?.data?.taskId;
}

/**
 * Checks the status of the task and gets the image URL
 */
async function checkImageStatus(id) {
    const { data: response } = await axios.get(`https://api.vider.ai/api/freev1/task_get/${id}`, {
        headers: {
            "user-agent": "Mozilla/5.0",
            "accept": "*/*",
            "origin": "https://vider.ai"
        },
    });
    
    return {
        finished: response?.data?.finish === 1,
        url: response?.data?.result?.file_url
    };
}

// --- COMMAND: VIDERAI ---

cmd({
    pattern: "viderai",
    alias: ["genimg", "vimg", "paint"],
    desc: "Generate AI images using Vider.ai.",
    category: "ai",
    use: ".viderai a futuristic city in space",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        if (!text) return reply(`🎨 *AI Image Generator*\n\nUsage: \`${prefix + command} <your prompt>\`\nExample: \`${prefix + command} a cute cat wearing a spacesuit\``);

        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
        
        reply(`_🎨 Creating your masterpiece, please wait..._`);

        // Step 1: Create Task
        const taskId = await viderAiTask(text);
        if (!taskId) throw new Error("Could not create AI task.");

        // Step 2: Polling (Check status every 10 seconds, up to 10 times)
        let result = { finished: false, url: null };
        let attempts = 0;
        const maxAttempts = 12; // Wait up to 2 minutes total
        
        // Initial wait for AI to warm up
        await new Promise(resolve => setTimeout(resolve, 15000));

        while (!result.url && attempts < maxAttempts) {
            attempts++;
            result = await checkImageStatus(taskId);
            
            if (result.url) break;
            
            // Wait 10 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        if (result.url) {
            // Step 3: Send Final Image
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `✨ *VIDER AI GENERATED*\n\n📝 *Prompt:* ${text}\n🚀 *Model:* Free-V1\n\n*🚀 Powered by KAMRAN-MD*`,
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
        } else {
            throw new Error("Image processing took too long or failed.");
        }

    } catch (e) {
        console.error("ViderAI Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *AI Error:* ${e.message || "Failed to generate image."}`);
    }
});
