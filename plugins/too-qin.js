const { cmd } = require('../command');
const crypto = require('crypto');
const axios = require('axios');

// --- ENCRYPTION CONFIG ---
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`;

const APP_ID = "aifaceswap";
const U_ID = "1H5tRtzsBkqXcaJ";

// --- HELPERS ---
const generateRandomString = (len) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const aesenc = (data, key) => {
    const k = CryptoJS.enc.Utf8.parse(key);
    return CryptoJS.AES.encrypt(data, k, { iv: k, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
};

const rsaenc = (data) => crypto.publicEncrypt(
    { key: PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(data, 'utf8')
).toString('base64');

const gencryptoheaders = (type, fp = null) => {
    const n = Math.floor(Date.now() / 1000);
    const r = crypto.randomUUID();
    const i = generateRandomString(16);
    const fingerPrint = fp || crypto.randomBytes(16).toString('hex');
    const s = rsaenc(i);
    const signStr = type === 'upload' ? `${APP_ID}:${r}:${s}` : `${APP_ID}:${U_ID}:${n}:${r}:${s}`;
    return {
        'fp': fingerPrint,
        'x-guide': s,
        'x-sign': aesenc(signStr, i),
        'x-code': Date.now().toString()
    };
};

// --- COMMAND ---
cmd({
    pattern: "gen",
    alias: ["aiimage", "imagine", "live3d"],
    category: "ai",
    react: "🎨",
    desc: "Generate AI Image using Live3D"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {

    if (!q) return reply("Bhai, prompt toh dein! \nExample: .gen a cute cat sleeping");

    await react("⏳");
    const cryptoHeaders = gencryptoheaders('create');
    
    try {
        // 1. Create Task
        const createRes = await axios.post('https://app.live3d.io/aitools/of/create', {
            fn_name: 'demo-image-editor',
            call_type: 3,
            input: { model: 'nano_banana_pro', source_images: [], prompt: q, aspect_radio: '1:1', request_from: 9 },
            request_from: 9,
            origin_from: '8f3f0c7387123ae0'
        }, {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/json',
                ...cryptoHeaders 
            }
        });

        const taskId = createRes.data?.data?.task_id;
        if (!taskId) return reply("❌ Task create nahi ho saka.");

        // 2. Poll Status
        let result;
        let attempts = 0;
        while (attempts < 15) {
            await new Promise(r => setTimeout(r, 4000));
            const checkHeaders = gencryptoheaders('check', cryptoHeaders.fp);
            const checkRes = await axios.post('https://app.live3d.io/aitools/of/check-status', {
                task_id: taskId, fn_name: 'demo-image-editor', call_type: 3, request_from: 9, origin_from: '8f3f0c7387123ae0'
            }, {
                headers: { 'User-Agent': 'Mozilla/5.0', ...checkHeaders }
            });

            result = checkRes.data.data;
            if (result.status === 2) break; // Status 2 means completed
            attempts++;
        }

        if (result && result.status === 2) {
            const imageUrl = 'https://temp.live3d.io/' + result.result_image;
            await conn.sendMessage(m.chat, { 
                image: { url: imageUrl }, 
                caption: `✅ *AI Image Generated*\n🎨 *Prompt:* ${q}\n\n> *${botFooter}*` 
            }, { quoted: mek });
            await react("✅");
        } else {
            reply("❌ Image generation mein boht waqt lag raha hai ya error aa gaya.");
        }

    } catch (e) {
        console.error(e);
        await react("❌");
        reply("❌ Error: " + e.message);
    }
});
