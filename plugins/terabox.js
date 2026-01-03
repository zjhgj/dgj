const { cmd } = require('../command');
const axios = require('axios');

// --- Helper Functions for Vider AI ---
async function viderAi(prompt) {
    const { data } = await axios.post('https://api.vider.ai/api/freev1/task_create/free-ai-image-generator', {
        params: {
            model: "free-ai-image-generator",
            image: "",
            aspectRatio: 1,
            prompt: prompt
        }
    }, {
        headers: {
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
            "content-type": "application/json",
            "accept": "*/*",
            "origin": "https://vider.ai"
        }
    });
    return data?.data?.taskId;
}

async function getImage(id) {
    const { data: response } = await axios.get(`https://api.vider.ai/api/freev1/task_get/${id}`, {
        headers: {
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
            "accept": "*/*",
            "origin": "https://vider.ai"
        },
    });
    return {
        finished: response?.data?.finish === 1,
        url: response?.data?.result?.file_url
    };
}

// --- Command ---
cmd({
    pattern: "imagine",
    alias: ["gen", "aiimg", "draw"],
    react: "🎨",
    desc: "Generate AI images from text prompt using ViderAI.",
    category: "ai",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a prompt (e.g., .imagine a futuristic city).");

        reply("⏳ *AI is drawing your imagination...*\nThis might take about 30-60 seconds.");

        // 1. Task Create کریں
        const taskId = await viderAi(q);
        if (!taskId) throw new Error("Could not create AI task.");

        // 2. Polling (رزلٹ کا انتظار کریں)
        let result = { finished: false, url: null };
        let attempts = 0;
        const maxAttempts = 15; // زیادہ سے زیادہ 15 بار چیک کرے گا

        // پہلا انتظار تھوڑا لمبا رکھیں کیونکہ AI وقت لیتا ہے
        await new Promise(resolve => setTimeout(resolve, 20000));

        while (!result.url && attempts < maxAttempts) {
            attempts++;
            result = await getImage(taskId);
            
            if (result.url) break; // اگر تصویر مل گئی تو لوپ ختم
            
            // اگر ابھی تیار نہیں ہوئی تو 10 سیکنڈ مزید انتظار کریں
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        if (result.url) {
            // 3. تصویر بھیجیں
            await conn.sendMessage(from, { 
                image: { url: result.url }, 
                caption: `✅ *AI Image Generated*\n\n*Prompt:* ${q}\n*Model:* ViderAI` 
            }, { quoted: mek });
        } else {
            reply("❌ Error: AI took too long to respond. Please try again with a different prompt.");
        }

    } catch (e) {
        console.error("ViderAI Error:", e);
        reply("❌ Failed to generate image. The server might be busy.");
    }
});
