const { cmd } = require("../command");
const axios = require("axios");

// Headers configuration jo aapne di thi
const H = {
  html: {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
  },
  api: {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "origin": "https://v1.ytmp3.ai",
    "referer": "https://v1.ytmp3.ai/",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
  }
};

// YTMP3 Scraping Function logic
async function ytmp3(youtubeURL, format = "mp3") {
  const ts = () => Math.floor(Date.now() / 1000);

  const vid = (() => {
    if (youtubeURL.includes("youtu.be/")) return /\/([a-zA-Z0-9_-]{11})/.exec(youtubeURL)?.[1];
    if (youtubeURL.includes("youtube.com")) {
      if (youtubeURL.includes("/live/") || youtubeURL.includes("/shorts/"))
        return /\/([a-zA-Z0-9_-]{11})/.exec(youtubeURL)?.[1];
      return /v=([a-zA-Z0-9_-]{11})/.exec(youtubeURL)?.[1];
    }
  })();
  
  if (!vid) return { error: "Invalid YouTube URL" };

  try {
    const htmlRes = await axios.get("https://v1.ytmp3.ai/", { headers: H.html });
    const jsonMatch = /var json = JSON\.parse\('(.+?)'\)/.exec(htmlRes.data);
    if (!jsonMatch) return { error: "API Token matching failed" };

    const json = JSON.parse(jsonMatch[1]);
    let token = "";
    for (let i = 0; i < json[0].length; i++)
      token += String.fromCharCode(json[0][i] - json[2][json[2].length - (i + 1)]);
    if (json[1]) token = token.split("").reverse().join("");
    if (token.length > 32) token = token.substring(0, 32);

    const initRes = (await axios.get(
      `https://epsilon.epsiloncloud.org/api/v1/init?${String.fromCharCode(json[6])}=${encodeURIComponent(token)}&t=${ts()}`,
      { headers: H.api }
    )).data;
    
    if (initRes.error > 0) return { error: `Init error: ${initRes.error}` };

    let cvtURL = initRes.convertURL;
    if (cvtURL.includes("&v=")) cvtURL = cvtURL.split("&v=")[0];
    
    const cvtRes = (await axios.get(
      `${cvtURL}&v=${vid}&f=${format}&t=${ts()}`,
      { headers: H.api }
    )).data;
    
    if (cvtRes.error > 0) return { error: `Conversion error: ${cvtRes.error}` };

    let finalData = cvtRes;
    if (cvtRes.redirect === 1) {
      finalData = (await axios.get(`${cvtRes.redirectURL.split("&v=")[0]}&v=${vid}&f=${format}&t=${ts()}`, { headers: H.api })).data;
    }

    let { progressURL, downloadURL, title } = finalData;

    // Wait loop jab tak progress complete na ho jaye
    while (true) {
      const prog = (await axios.get(`${progressURL}&t=${ts()}`, { headers: H.api })).data;
      if (prog.error > 0) return { error: `Processing error: ${prog.error}` };
      if (prog.progress >= 3) break;
      await new Promise(r => setTimeout(r, 3000));
    }

    return { title, format, downloadURL };
  } catch (err) {
    return { error: err.message };
  }
}

// ================= COMMAND REGISTER =================

cmd({
    pattern: "play42",
    alias: ["song24", "ytmp3v2"],
    desc: "Download MP3 via YTMP3.ai Scraper",
    category: "download",
    react: "🎧",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("Please provide a YouTube Link! 🔗");

    await reply("⏳ *Processing your request...* (Progress monitoring active)");

    const result = await ytmp3(q, "mp3");

    if (result.error) {
        return reply(`❌ *Error:* ${result.error}`);
    }

    try {
        await conn.sendMessage(from, {
            audio: { url: result.downloadURL },
            mimetype: 'audio/mpeg',
            fileName: `${result.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: result.title,
                    body: "Downloaded by Kamran-MD",
                    mediaType: 1,
                    sourceUrl: q,
                    thumbnailUrl: "https://files.catbox.moe/sx07qa.jpg", // Aap apni image ka link laga sakte hain
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ *Failed to send audio.*");
    }
});
                                   
