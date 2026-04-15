const { cmd } = require("../command");
const axios = require('axios');

// ================= ReactChannel Class Implementation =================
class ReactChannel {
    constructor(userJwt) {
        this.userJwt = userJwt;
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
        const params = {
            apikey: 'free',
            sitekey: this.siteKey,
            url: 'https://asitha.top/channel-manager'
        };
        const response = await this.axiosInstance.get(this.bypassApiUrl, { params });
        if (!response.data.status) throw new Error(`Bypass Failed: ${response.data.message}`);
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
    pattern: "reactchannel",
    alias: ["rch", "chreact"],
    desc: "React to WhatsApp Channel post using JWT.",
    category: "tools",
    react: "🔄",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    // Usage check: .reactchannel link|emoji|jwt
    if (!q) return reply("⚠️ *Usage:* .reactchannel [Link]|[Emoji]|[JWT]\n\n*Example:*\n.reactchannel https://whatsapp.com/channel/xxx/123|🔥,❤️|your_jwt_here");

    const parts = q.split('|');
    if (parts.length < 3) return reply("❌ Format galat hai! Link, Emojis aur JWT teeno lazmi hain.");

    const postLink = parts[0].trim();
    const reacts = parts[1].trim();
    const userJwt = parts[2].trim();

    await reply("⏳ *Processing Reaction...* (reCAPTCHA Bypass in progress)");

    try {
        const reactor = new ReactChannel(userJwt);
        const result = await reactor.reactToPost(postLink, reacts);

        if (result.status || result.success) {
            return reply(`✅ *Success!* \n\n📝 *Post:* ${postLink}\n🎭 *Reacts:* ${reacts}\n💬 *Server Msg:* ${result.message || "Done"}`);
        } else {
            return reply(`❌ *Server Refused:* ${JSON.stringify(result)}`);
        }

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
