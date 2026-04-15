const { cmd } = require("../command");
const axios = require('axios');

// ================= ORIGINAL CLASS LOGIC =================
class ReactChannel {
    constructor(config) {
        this.userJwt = config.userJwt;
        this.bypassApiUrl = 'https://api.xbotzlauncher.site/bypass/recaptcha-v3';
        this.siteKey = '6LemKk8sAAAAAH5PB3f1EspbMlXjtwv5C8tiMHSm';
        this.backendUrl = 'https://back.asitha.top/api';
        this.axiosInstance = axios.create({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.userJwt}`
            }
        });
    }

    async getRecaptchaToken() {
        const params = { apikey: 'free', sitekey: this.siteKey, url: 'https://asitha.top/channel-manager' };
        const response = await this.axiosInstance.get(this.bypassApiUrl, { params });
        if (!response.data.status) throw new Error(`Bypass Failed`);
        return response.data.result.token;
    }

    async getTempApiKey(recaptchaToken) {
        const url = `${this.backendUrl}/user/get-temp-token`;
        const response = await this.axiosInstance.post(url, { recaptcha_token: recaptchaToken });
        if (!response.data.token) throw new Error('Temp API Key failed');
        return response.data.token;
    }

    async reactToPost(postLink, reacts) {
        const recaptchaToken = await this.getRecaptchaToken();
        const tempApiKey = await this.getTempApiKey(recaptchaToken);
        const url = `${this.backendUrl}/channel/react-to-post?apiKey=${tempApiKey}`;
        const response = await this.axiosInstance.post(url, { post_link: postLink, reacts: reacts });
        return response.data;
    }
}

// ================= KAMRAN-MD COMMAND =================

cmd({
    pattern: "rch",
    alias: ["creact"],
    desc: "React to Channel post (Auto Token)",
    category: "tools",
    react: "🔄",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    // Yahan maine aapka token fix kar diya hai
    const savedToken = "ea34f011cde6729ff919fe9a3f458b1bd6687b102c9a9e3a70ebcc6f0bd5e970";

    if (!q) return reply("⚠️ *Usage:* .rch [Link]|[Emoji]");

    const inputParts = q.split('|');
    if (inputParts.length < 2) return reply("❌ Format: .rch link|emoji");

    const postLink = inputParts[0].trim();
    const emojis = inputParts[1].trim();

    await reply("⏳ *Processing Reaction...*");

    try {
        const rch = new ReactChannel({ userJwt: savedToken });
        const result = await rch.reactToPost(postLink, emojis);

        if (result.status || result.success) {
            return reply(`✅ *Success!*\n\n📝 *Msg:* ${result.message || "Reaction Sent"}`);
        } else {
            // Agar coins khatam honge to yahan error dikhayega
            return reply(`❌ *Server Msg:* ${result.message || JSON.stringify(result)}`);
        }

    } catch (e) {
        reply(`❌ *Error:* ${e.message}`);
    }
});

