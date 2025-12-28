//---------------------------------------------------------------------------
//           KAMRAN-MD - ADVANCED MULTI DOWNLOADER (V2)
//---------------------------------------------------------------------------
//  🚀 SUPPORT FOR MP3 & VIDEO (720P, 480P, 360P) - LID & NEWSLETTER
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

class VidsSave {
    constructor() {
        this.baseUrl = "https://api.vidssave.com";
        this.authToken = "20250901majwlqo";
        this.headers = {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
            "accept": "*/*",
            "content-type": "application/x-www-form-urlencoded",
            "Referer": "https://vidssave.com/",
            "Origin": "https://vidssave.com"
        };
    }

    async getResources(url) {
        try {
            const body = `auth=${this.authToken}&domain=api-ak.vidssave.com&origin=source&link=${encodeURIComponent(url)}`;
            const { data } = await axios.post(`${this.baseUrl}/api/contentsite_api/media/parse`, body, { headers: this.headers });
            if (!data || data.status !== 1) return null;
            return data.data;
        } catch (error) { return null; }
    }

    async resolveDownloadLink(resourceToken) {
        if (!resourceToken) return null;
        try {
            const taskBody = `auth=${this.authToken}&domain=api-ak.vidssave.com&request=${encodeURIComponent(resourceToken)}&no_encrypt=1`;
            const { data: taskData } = await axios.post(`${this.baseUrl}/api/contentsite_api/media/download`, taskBody, { headers: this.headers });
            if (!taskData || taskData.status !== 1) return null;

            const queryParams = new URLSearchParams({
                auth: this.authToken,
                domain: "api-ak.vidssave.com",
                task_id: taskData.data.task_id,
                download_domain: "vidssave.com",
                origin: "content_site"
            }).toString();

            let finalUrl = null;
            for (let i = 0; i < 12; i++) {
                const { data: sseString } = await axios.get(`${this.baseUrl}/sse/contentsite_api/media/download_query?${queryParams}`, {
                    headers: { ...this.headers, "accept": "text/event-stream" },
                    responseType: "text"
                });

                const lines = sseString.split("\n");
                for (const line of lines) {
                    if (line.includes("data:")) {
                        try {
                            const json = JSON.parse(line.replace("data:", "").replace("event: success", "").trim());
                            if (json.status === "success" && json.download_link) {
                                finalUrl = json.download_link;
                                break;
                            }
                        } catch (e) {}
                    }
                }
                if (finalUrl) break;
                await new Promise(r => setTimeout(r, 1000));
            }
            return finalUrl;
        } catch (e) { return null; }
    }
}

const scraper = new VidsSave();

// Main Command
cmd({
    pattern: "ytdl",
    alias: ["song", "video2", "audio1"],
    desc: "Download YouTube/Social Media in MP3 or Video (Multiple Qualities).",
    category: "download",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("📥 *KAMRAN-MD DOWNLOADER*\n\nUsage: `.ytdl <link>`\nExample: `.ytdl https://youtube.com/...` ");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const data = await scraper.getResources(text);
        if (!data) return reply("❌ Link invalid ya API error!");

        const { title, thumbnail, resources } = data;

        // Filtering Versions
        const v720 = resources.find(r => r.quality === "720P" && r.type === "video");
        const v480 = resources.find(r => r.quality === "480P" && r.type === "video");
        const v360 = resources.find(r => r.quality === "360P" && r.type === "video");
        const audio = resources.find(r => r.type === "audio");

        let msg = `╭──〔 *📥 DOWNLOAD MENU* 〕  
├─ 📝 *Title:* ${title}
├─ 🔗 *Source:* YouTube / Social
╰───────────────────🚀\n
*Reply with a number to download:*

1️⃣ *Audio (MP3)*
2️⃣ *Video (720p - HD)*
3️⃣ *Video (480p - SD)*
4️⃣ *Video (360p - Low)*

*🚀 Powered by KAMRAN-MD*`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: msg,
            contextInfo: newsletterContext
        }, { quoted: mek });

        // Listening for selection
        conn.ev.on('messages.upsert', async (chatUpdate) => {
            const msgUpdate = chatUpdate.messages[0];
            if (!msgUpdate.message || !msgUpdate.message.extendedTextMessage) return;
            
            const selected = msgUpdate.message.extendedTextMessage.text;
            const quotedId = msgUpdate.message.extendedTextMessage.contextInfo.stanzaId;

            if (quotedId === sentMsg.key.id) {
                await conn.sendMessage(from, { react: { text: "📥", key: msgUpdate.key } });
                let targetResource = null;
                let type = "video";

                if (selected === "1") { targetResource = audio; type = "audio"; }
                else if (selected === "2") targetResource = v720;
                else if (selected === "3") targetResource = v480;
                else if (selected === "4") targetResource = v360;

                if (targetResource) {
                    const dlLink = await scraper.resolveDownloadLink(targetResource.resource_content);
                    if (dlLink) {
                        if (type === "audio") {
                            await conn.sendMessage(from, { 
                                audio: { url: dlLink }, 
                                mimetype: 'audio/mpeg', 
                                contextInfo: newsletterContext 
                            }, { quoted: msgUpdate });
                        } else {
                            await conn.sendMessage(from, { 
                                video: { url: dlLink }, 
                                caption: `*✅ Downloaded: ${targetResource.quality}*`, 
                                contextInfo: newsletterContext 
                            }, { quoted: msgUpdate });
                        }
                    } else {
                        reply("❌ Download link generate nahi ho saka!");
                    }
                }
            }
        });

    } catch (e) {
        console.error(e);
        reply("❌ Kuch galat ho gaya!");
    }
});
