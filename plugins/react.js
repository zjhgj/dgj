const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// --- Auth Generator Class (Converted to CJS) ---
class AuthGenerator {
    static PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa2oPxMZe71V4dw2r8rHWt59gH
W5INRmlhepe6GUanrHykqKdlIB4kcJiu8dHC/FJeppOXVoKz82pvwZCmSUrF/1yr
rnmUDjqUefDu8myjhcbio6CnG5TtQfwN2pz3g6yHkLgp8cFfyPSWwyOCMMMsTU9s
snOjvdDb4wiZI8x3UwIDAQAB
-----END PUBLIC KEY-----`;

    static S = "NHGNy5YFz7HeFb";

    constructor(appId) {
        this.appId = appId;
    }

    aesEncrypt(data, key, iv) {
        const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(key), Buffer.from(iv));
        let encrypted = cipher.update(data, "utf8", "base64");
        encrypted += cipher.final("base64");
        return encrypted;
    }

    generateRandomString(length) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const bytes = crypto.randomBytes(length);
        return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
    }

    generate() {
        const t = Math.floor(Date.now() / 1000).toString();
        const nonce = crypto.randomUUID();
        const tempAesKey = this.generateRandomString(16);

        const encryptedData = crypto.publicEncrypt({
            key: AuthGenerator.PUBLIC_KEY,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(tempAesKey));

        const secret_key = encryptedData.toString("base64");
        const dataToSign = `${this.appId}:${AuthGenerator.S}:${t}:${nonce}:${secret_key}`;
        const sign = this.aesEncrypt(dataToSign, tempAesKey, tempAesKey);

        return { app_id: this.appId, t, nonce, sign, secret_key };
    }
}

// --- Command Handler ---
cmd({
    pattern: "editimg",
    alias: ["ai-editimg", "banana", "reimage"],
    react: "🍌",
    desc: "AI Image Transformation (Nano Banana AI)",
    category: "ai",
    use: ".tofigure <reply image + prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || "";

        if (!mime.startsWith("image/")) return reply("❌ Please reply to an image!");
        if (!q) return reply("❌ Prompt missing! Example: .tofigure make it a superhero");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // 1. Prepare Auth & Data
        const auth = new AuthGenerator("ai_df");
        const authData = auth.generate();
        const userId = auth.generateRandomString(64).toLowerCase();
        const buffer = await quoted.download();

        const instance = axios.create({
            baseURL: "https://apiv1.deepfakemaker.io/api",
            params: authData,
            headers: {
                "Content-Type": "application/json",
                Referer: "https://deepfakemaker.io/nano-banana-ai/",
            },
        });

        // 2. Upload Sign & S3 Upload
        const file = await instance.post("/user/v2/upload-sign", {
            filename: auth.generateRandomString(32) + ".jpg",
            hash: crypto.createHash("sha256").update(buffer).digest("hex"),
            user_id: userId,
        }).then((res) => res.data);

        await axios.put(file.data.url, buffer, {
            headers: { "content-type": "image/jpeg", "content-length": buffer.length }
        });

        // 3. Create Task
        const task = await instance.post("/replicate/v1/free/nano/banana/task", {
            prompt: q,
            platform: "nano_banana",
            images: ["https://cdn.deepfakemaker.io/" + file.data.object_name],
            output_format: "png",
            user_id: userId,
        }).then((res) => res.data);

        // 4. Polling for result
        const resultUrl = await new Promise((resolve, reject) => {
            let retry = 25;
            const interval = setInterval(async () => {
                try {
                    const check = await instance.get("/replicate/v1/free/nano/banana/task", {
                        params: { user_id: userId, ...task.data },
                    }).then((res) => res.data);

                    if (check.msg === "success") {
                        clearInterval(interval);
                        resolve(check.data.generate_url);
                    }
                } catch (e) { /* silent retry */ }

                if (--retry <= 0) {
                    clearInterval(interval);
                    reject(new Error("AI Task Timeout! Process slow hai, baad mein try karein."));
                }
            }, 3000);
        });

        // 5. Send Final Image
        await conn.sendMessage(from, {
            image: { url: resultUrl },
            caption: `🍌 *NANO BANANA AI DONE*\n\n📝 *Prompt:* ${q}\n\n> © KAMRAN-MD❤️`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
            
