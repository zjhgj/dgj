const { cmd } = require('../command'); // Aapke bot ka standard path
const axios = require('axios');

// --- DOWNLOADER CLASS LOGIC ---
class AllInOneDownloader {
  constructor() {
    this.baseURL = 'https://allinonedownloader.com';
    this.endpoint = '/system/3c829fbbcf0387c.php';
  }

  async fetchMedia(url) {
    const headers = {
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'referer': `${this.baseURL}/`
    };

    const payload = new URLSearchParams({
      url: url,
      token: 'ac98e0708b18806a7e0aedaf8bfd135b9605ce9e617aebbdf3118d402ae6f15f', //
      urlhash: '/EW6oWxKREb5Ji1lQRgY2f4FkImCr6gbFo1HX4VAUuiJrN+7veIcnrr+ZrfMg0Jyo46ABKmFUhf2LpwuIxiFJZZObl9tfJG7E9EMVNIbkNyiqCIdpc61WKeMmmbMW+n6' //
    });

    try {
      const { data } = await axios.post(`${this.baseURL}${this.endpoint}`, payload.toString(), { headers });
      return data;
    } catch (e) {
      return null;
    }
  }
}

const downloader = new AllInOneDownloader();

// --- BOT COMMAND ---
cmd({
    pattern: "dl",
    alias: ["alldl", "down"],
    category: "downloader",
    react: "📥",
    desc: "Download video from TikTok, FB, IG, etc."
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    
    if (!q) {
        await react("❌");
        return reply("Bhai, kisi bhi video ka link dein!\nExample: .dl https://www.tiktok.com/xxx");
    }

    await react("⏳");

    try {
        const result = await downloader.fetchMedia(q);

        if (!result || !result.links || result.links.length === 0) {
            await react("❌");
            return reply("❌ Media link nahi mil saka. Shayad link expired hai.");
        }

        // Sabse pehla high quality link uthana
        const downloadUrl = result.links[0].url;
        const title = result.title || "All-In-One Downloader";

        // Check if it's a video or image based on link or type
        const isVideo = downloadUrl.includes(".mp4") || q.includes("tiktok") || q.includes("reel");

        if (isVideo) {
            await conn.sendMessage(m.chat, {
                video: { url: downloadUrl },
                caption: `🎬 *Title:* ${title}\n\n> *${botFooter || 'DR KAMRAN-MD'}*`,
                mimetype: "video/mp4"
            }, { quoted: mek });
        } else {
            await conn.sendMessage(m.chat, {
                image: { url: downloadUrl },
                caption: `🖼️ *Title:* ${title}\n\n> *${botFooter || 'DR KAMRAN-MD'}*`
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error("DL Error:", e.message);
        await react("❌");
        reply("❌ Error: " + e.message);
    }
});
