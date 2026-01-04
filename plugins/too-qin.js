//---------------------------------------------------------------------------
//           KAMRAN-MD - QIN SHI HUANG AI TRANSFORMER
//---------------------------------------------------------------------------
//  🚀 WEAR THE COSTUME OF QIN SHI HUANG (RECORD OF RAGNAROK)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

const DEFAULT_PROMPT = `
Buat saya memakai kostum Qin Shi Huang dari anime Record of Ragnarok, termasuk desain penutup mata dan pakaian yang dikenakan Qin Shi Huang di dalam anime Record of Ragnarok. Buatkan pose khasnya.

Characterized by stark cinematic lighting and intense contrast. Captured with a slightly low, upward-facing angle that dramatizes the subject's jawline and neck, the composition evokes quiet dominance and sculptural elegance. The background is a deep, saturated crimson red, creating a bold visual clash with the model's luminous skin and dark wardrobe.

Lighting is tightly directional, casting warm golden highlights on one side of the face while plunging the other into velvety shadow, emphasizing bone structure with almost architectural precision.

The subject's expression is unreadable, cool-toned eyes half-lidded, lips relaxed—suggesting detachment or quiet defiance. The model wears a highly detailed and realistic costume inspired by the anime, preserving anime-like colors and textures.

Minimal retouching preserves skin texture and slight imperfections, adding realism. Editorial tension is created through close cropping, tonal control, and the almost oppressive intimacy of the camera's proximity.

Make the face and hairstyle as similar as possible to the one in the photo. Pertahankan gaya rambut dan warna yang sama. Buat kostumnya sangat detail dan realistis. Gunakan warna dan tekstur yang mirip anime.
`.trim();

cmd({
    pattern: "toqin",
    alias: ["qin", "roqin"],
    desc: "Transform your photo into Qin Shi Huang style.",
    category: "ai",
    use: "reply to a photo",
    filename: __filename,
}, async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        // Check for Image
        if (!/image\/(jpeg|jpg|png)/i.test(mime)) {
            return reply("🍂 *Please reply to the image you want to edit.*");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download image buffer
        const buffer = await q.download();
        if (!buffer) return reply("🍂 *Failed to read the image.*");

        // Convert to Base64
        const imageBase64 = buffer.toString("base64");

        const payload = {
            image: imageBase64,
            prompt: DEFAULT_PROMPT
        };

        // API Call using Axios
        const res = await axios.post("https://ai-studio.anisaofc.my.id/api/edit-image", payload, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
                "Origin": "https://ai-studio.anisaofc.my.id",
                "Referer": "https://ai-studio.anisaofc.my.id/"
            }
        });

        const result = res.data;

        if (!result?.imageUrl) {
            return reply("🍂 *Failed to edit image.*\nServer did not return a result.");
        }

        // Send Final Image
        await conn.sendMessage(from, { 
            image: { url: result.imageUrl }, 
            caption: `👑 *Qin Shi Huang Transformation Complete*\n\n*Character:* Qin Shi Huang\n*Series:* Record of Ragnarok\n*🚀 Powered by KAMRAN-MD*` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("🍂 *An error occurred while processing the image.*");
    }
});
