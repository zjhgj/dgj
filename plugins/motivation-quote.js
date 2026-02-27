const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// --- API Configurations ---
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`;

const fp = crypto.randomUUID();
let cachethemeversi = null;

const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'origin': 'https://aifaceswap.io',
    'referer': 'https://aifaceswap.io/nano-banana-ai/'
};

// --- Helper Functions ---
async function ambilthemeversi() {
    if (cachethemeversi) return cachethemeversi;
    try {
        const res = await axios.get('https://aifaceswap.io/nano-banana-ai/');
        const jsMatch = res.data.match(/src="([^"]*aifaceswap_nano_banana[^"]*\.js)"/);
        let jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : `https://aifaceswap.io${jsMatch[1]}`;
        const jsRes = await axios.get(jsUrl);
        const themeMatch = jsRes.data.match(/headers\["theme-version"\]="([^"]+)"/);
        cachethemeversi = themeMatch ? themeMatch[1] : 'EC25Co3HGfI91bGmpWR6JF0JKD+nZ/mD0OYvKNm5WUXcLfKnEE/80DQg60MXcYpM';
    } catch { cachethemeversi = 'EC25Co3HGfI91bGmpWR6JF0JKD+nZ/mD0OYvKNm5WUXcLfKnEE/80DQg60MXcYpM'; }
    return cachethemeversi;
}

async function gensigs() {
    const themeVersion = await ambilthemeversi();
    const aesSecret = crypto.randomBytes(8).toString('hex');
    const xGuide = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(aesSecret, 'utf8')).toString('base64');
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(aesSecret), Buffer.from(aesSecret));
    let fp1 = cipher.update('aifaceswap:' + fp, 'utf8', 'base64');
    fp1 += cipher.final('base64');
    return { 'fp': fp, 'fp1': fp1, 'x-guide': xGuide, 'x-code': Date.now().toString(), 'theme-version': themeVersion };
}

// --- Bot Command ---
cmd({
    pattern: "nano",
    alias: ["banana", "nanobanana"],
    react: "🍌",
    desc: "AI Nano Banana Image Editor",
    category: "ai",
    use: ".nano <reply image + prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    
    // FIX: Safe Key logic
    const msgKey = m?.key || mek?.key || null;

    try {
        const quoted = m.quoted ? m.quoted : (m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message?.imageMessage || m);
        const mime = (m.quoted ? m.quoted.mimetype : m.mimetype) || (quoted.mimetype) || "";

        if (!mime.includes("image")) return reply("❌ Please reply to an image!");
        if (!q) return reply("📝 Please provide a prompt (e.g., .nano change background to forest)");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        const waitMsg = await reply("🍌 *AI NANO-BANANA PROCESSING...*");

        // 1. Download Media
        const stream = await downloadContentFromMessage(m.quoted ? m.quoted : m.message.imageMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const tempPath = `./nano_${Date.now()}.jpg`;
        fs.writeFileSync(tempPath, buffer);

        // 2. Upload Image
        const sigs = await gensigs();
        const upRes = await axios.post('https://aifaceswap.io/api/upload_file', {
            file_name: `image_${Date.now()}.jpg`,
            type: 'image', request_from: 1, origin_from: '4b06e7fa483b761a'
        }, { headers: { ...headers, ...sigs } });

        const putUrl = upRes.data.data.url;
        await axios.put(putUrl, fs.readFileSync(tempPath), { headers: { 'Content-Type': 'image/jpeg' } });
        const finalImgKey = putUrl.split('?')[0].split('.aliyuncs.com/')[1];

        // 3. Create & Check Job
        const jobRes = await axios.post('https://aifaceswap.io/api/aikit/create', {
            fn_name: 'demo-nano-banana', call_type: 1,
            input: { prompt: q, scene: 'standard', resolution: '1K', aspect_ratio: 'auto', source_images: [finalImgKey] },
            consume_type: 0, request_from: 1, origin_from: '4b06e7fa483b761a'
        }, { headers: { ...headers, ...await gensigs() } });

        const taskId = jobRes.data.data.task_id;
        let result = null;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 4000));
            const chk = await axios.post('https://aifaceswap.io/api/aikit/check_status', {
                task_id: taskId, fn_name: 'demo-nano-banana', call_type: 1, request_from: 1, origin_from: '4b06e7fa483b761a'
            }, { headers: { ...headers, ...await gensigs() } });
            result = chk.data.data;
            if (result && result.status === 2) break;
        }

        if (!result || !result.result_image) throw new Error("AI Timeout or Error");

        // 4. Send Result
        await conn.sendMessage(from, { 
            image: { url: result.result_image },
            caption: `🍌 *NANO-BANANA DONE*\n\n📝 *Prompt:* ${q}\n\n> © PROVA MD ❤️`
        }, { quoted: m });

        fs.unlinkSync(tempPath);
        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        reply(`❌ *Failed:* ${e.message}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
        
