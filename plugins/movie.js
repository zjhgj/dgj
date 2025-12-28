//---------------------------------------------------------------------------
//           KAMRAN-MD - ALL VIDEO DOWNLOADER (VIDSSAVE)
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD FROM YT, IG, FB, TT, ETC. (LID & NEWSLETTER SUPPORT)
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
            for (let i = 0; i < 10; i++) {
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

    async scrape(url) {
        const data = await this.getResources(url);
        if (!data) return { status: false };

        const { title, thumbnail, resources } = data;
        let videoRes = resources.filter(r => r.type === "video").sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
        const bestVideo = videoRes[0];
        const videoUrl = await this.resolveDownloadLink(bestVideo?.resource_content);

        return {
            status: true,
            title: title,
            thumbnail: thumbnail,
            videoUrl: videoUrl
        };
    }
}

const scraper = new VidsSave();

cmd({
    pattern: "MDV",
    alias: ["dl", "getvid", "youall"],
    desc: "Download videos from various platforms (YT, FB, IG, TT).",
    category: "download",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("📥 *All Video Downloader*\n\nUsage: `.dl <video link>`\nExample: `.dl https://www.youtube.com/watch?v=...` ");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const result = await scraper.scrape(text);

        if (!result.status || !result.videoUrl) {
            return reply("❌ Unable to fetch video. Please check the link.");
        }

        const caption = `╭──〔 *📥 DOWNLOADER* 〕  
├─ 📝 *Title:* ${result.title}
├─ 🔗 *Source:* Detected automatically
╰───────────────────🚀

*🚀 Powered by KAMRAN-MD*`;

        // Sending Video
        await conn.sendMessage(from, { 
            video: { url: result.videoUrl }, 
            caption: caption,
            contextInfo: newsletterContext
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Download Error:", e);
        reply("❌ An error occurred while processing the download.");
    }
});
