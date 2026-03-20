const { cmd } = require('../command');
const axios = require('axios');

class AllInOneDownloader {
  constructor() {
    this.baseURL = 'https://allinonedownloader.com';
    this.endpoint = '/system/3c829fbbcf0387c.php';
  }

  async download(url) {
    const headers = {
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'referer': `${this.baseURL}/`,
      'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
      'x-requested-with': 'XMLHttpRequest'
    };

    const payload = new URLSearchParams({
      url: url,
      // Note: Ye tokens expire ho sakte hain, agar error aaye to website se naya token nikalna hoga
      token: 'ac98e0708b18806a7e0aedaf8bfd135b9605ce9e617aebbdf3118d402ae6f15f',
      urlhash: '/EW6oWxKREb5Ji1lQRgY2f4FkImCr6gbFo1HX4VAUuiJrN+7veIcnrr+ZrfMg0Jyo46ABKmFUhf2LpwuIxiFJZZObl9tfJG7E9EMVNIbkNyiqCIdpc61WKeMmmbMW+n6'
    });

    const response = await axios.post(`${this.baseURL}${this.endpoint}`, payload.toString(), { headers });
    return response.data;
  }
}

cmd({
    pattern: "dl",
    alias: ["video", "allinone"],
    desc: "Download from TikTok, IG, FB, etc.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Link dein (TikTok/IG/FB/YT).*");
        
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        
        const downloader = new AllInOneDownloader();
        const result = await downloader.download(q);

        // Result parsing logic (adjust based on actual JSON response)
        // Usually, the response contains a 'medias' array or 'links'
        if (!result || result.error) {
            return reply("❌ *Download fail hogaya.* Link check karein ya API token expire ho chuka hai.");
        }

        // Search for highest quality video link
        let downloadLink = "";
        let title = result.title || "Downloaded Media";

        if (result.medias && result.medias.length > 0) {
            // Filter for video or first available link
            downloadLink = result.medias.find(m => m.extension === 'mp4' || m.type === 'video')?.url || result.medias[0].url;
        }

        if (!downloadLink) throw new Error("No download link found");

        // Sending the media
        await conn.sendMessage(from, { 
            video: { url: downloadLink }, 
            caption: `✅ *Success: ${title}*\n\nPowered by AllInOne`,
            mimetype: 'video/mp4'
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ *Error:* " + e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
