//---------------------------------------------------------------------------
//           KAMRAN-MD - AI TEXT HUMANIZER (REWRITER)
//---------------------------------------------------------------------------
//  🚀 CONVERT AI-TONE TEXT INTO NATURAL HUMAN-LIKE LANGUAGE
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Humanizer Class to interact with the backend API
 */
class Humanizer {
  constructor() {
    this.ajax = "https://www.reliablesoft.net/wp-admin/admin-ajax.php";
  }

  async humanize(text, lang = "English") {
    try {
      const fd = new FormData();
      fd.append("action", "openai_process");
      fd.append("shortcode_action", "rewrite");
      fd.append(
        "text",
        `Rewrite the following text to sound like a natural human, avoid AI patterns, and keep it engaging:\n\n${text}`
      );
      fd.append("language", lang);
      fd.append("tone", "natural");

      const res = await axios.post(this.ajax, fd, {
        headers: {
            ...fd.getHeaders(),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.reliablesoft.net/ai-writing-tool/"
        }
      });

      return res.data;
    } catch (error) {
      throw new Error("Failed to connect to the humanizer service.");
    }
  }
}

const humanizer = new Humanizer();

// --- COMMAND: HUMANIZE ---

cmd({
    pattern: "humanize",
    alias: ["rewrite", "human"],
    desc: "Make AI text sound like a human wrote it.",
    category: "ai",
    use: ".humanize [Your AI Text]",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide the text you want to humanize.");

        // Reaction and initial message
        await conn.sendMessage(from, { react: { text: "✍️", key: mek.key } });
        const loadingMsg = await reply("_🔄 Processing text, making it sound more human..._");

        // Call the humanizer engine
        const result = await humanizer.humanize(q);

        if (result && result.success && result.data) {
            const humanizedText = result.data.trim();
            
            const response = `✨ *HUMANIZED TEXT* ✨\n\n${humanizedText}\n\n*🚀 Powered by KAMRAN-MD*`;

            await conn.sendMessage(from, {
                text: response,
                contextInfo: {
                    externalAdReply: {
                        title: "AI TEXT HUMANIZER",
                        body: "Making AI text natural and engaging",
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
                        sourceUrl: "https://github.com/KAMRAN-SMD/KAMRAN-MD",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            reply("❌ Sorry, I couldn't process that text. The service might be busy.");
        }

    } catch (e) {
        console.error("Humanizer Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message}`);
    }
});
