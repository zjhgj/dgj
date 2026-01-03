const { cmd } = require('../command');
const axios = require('axios');

// --- Scraper Logic ---
const TokStalk = {
    config: {
        baseUrl: "https://tokviewer.net/api",
        headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'origin': 'https://tokviewer.net',
            'referer': 'https://tokviewer.net/'
        }
    },
    stalk: async (username) => {
        try {
            const profileRes = await axios.post(`${TokStalk.config.baseUrl}/check-profile`, 
                { username: username }, 
                { headers: TokStalk.config.headers }
            );
            const profile = profileRes.data;
            if (profile.status !== 200 || !profile.data) throw new Error("Profile not found.");

            const videoRes = await axios.post(`${TokStalk.config.baseUrl}/video`, 
                { username: username, offset: 0, limit: 5 }, 
                { headers: TokStalk.config.headers }
            );
            const videos = videoRes.data;

            return {
                status: 200,
                result: {
                    user: profile.data,
                    videos: (videos.data || []).map(v => ({
                        cover: v.cover,
                        downloadUrl: v.downloadUrl
                    }))
                }
            };
        } catch (err) {
            throw err;
        }
    }
};

// --- Bot Command ---
cmd({
    pattern: "ttstalk",
    alias: ["tiktokstalk", "ttprofile"],
    react: "👤",
    desc: "Stalk a TikTok user profile and get details.",
    category: "search",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a TikTok username (e.g., .ttstalk khaby.lame)");

        reply(`⏳ Fetching details for *@${q}*...`);

        const data = await TokStalk.stalk(q);
        const user = data.result.user;
        const videos = data.result.videos;

        let stalkInfo = `👤 *TIKTOK STALKER* 👤\n\n` +
                        `✨ *Username:* ${q}\n` +
                        `👥 *Followers:* ${user.followers}\n` +
                        `👤 *Following:* ${user.following}\n` +
                        `❤️ *Total Likes:* ${user.likes}\n\n` +
                        `🎥 *Recent Videos:* \n`;

        videos.forEach((v, i) => {
            stalkInfo += `*${i + 1}.* ${v.downloadUrl}\n`;
        });

        stalkInfo += `\n_Powered by TokViewer & AgungDevX_`;

        // Profile Picture کے ساتھ رپورٹ بھیجیں
        await conn.sendMessage(from, { 
            image: { url: user.avatar }, 
            caption: stalkInfo 
        }, { quoted: mek });

    } catch (e) {
        console.error("TikTok Stalk Error:", e);
        reply("❌ Error: Could not find the user or the API is down.");
    }
});
