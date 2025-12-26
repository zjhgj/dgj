const axios = require("axios");
const { cmd } = require("../command"); // Assuming command.js is in the lib folder

// --- API Configuration ---
// These tokens are used to authenticate with the external reaction service.
const tokens = [
  "movanest-keyTLZTYRQXML", 
  "movanest-keyARCH6LACUC"
];

const DELAY_ON_LIMIT = 5000; // Delay in milliseconds (5 seconds) when an API limit is hit

/**
 * Attempts to send reactions to a WhatsApp post using the available tokens.
 * It implements token rotation and a retry delay upon hitting a rate limit.
 * * @param {string} postUrl - The URL of the WhatsApp channel post.
 * @param {string} emojis - The emojis to react with (e.g., "🎉").
 * @returns {Promise<{success: boolean, data?: object, status?: number, error?: any}>}
 */
async function reactToWhatsAppPost(postUrl, emojis) {
  for (const token of tokens) {
    try {
      const response = await axios.get(
        "https://movanest.zone.id/user-coin",
        {
          params: {
            user_api_key: token,
            postUrl,
            emojis
          },
          timeout: 500000 
        }
      );

      // If successful, return the data
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      
      console.error(`[ReactWA] Token ${token.substring(0, 10)}... failed. Status: ${status}, Error: ${msg}`);

      // Handle rate limit (Status 402 or error message containing "limit")
      if (status === 402 || (typeof msg === 'string' && msg.toLowerCase().includes("limit"))) {
        console.log(`[ReactWA] Token limited. Waiting for ${DELAY_ON_LIMIT / 1000}s before trying the next token.`);
        await new Promise(r => setTimeout(r, DELAY_ON_LIMIT));
        continue; // Try the next token
      }

      // If Unauthorized (401), skip this token and try the next one
      if (status === 401) {
        continue;
      }

      // For other general errors, return failure immediately
      return {
        success: false,
        status,
        error: error.response?.data || msg
      };
    }
  }

  // If the loop finishes without success
  return {
    success: false,
    status: 402,
    error: "All configured tokens are limited or exhausted."
  };
}


cmd({
    pattern: "chreact",
    alias: ["k", "react"],
    desc: "Sends reactions to a WhatsApp Channel post.",
    category: 'tools', 
    limit: true,
    react: '⚡',
    filename: __filename
}, async (conn, m, store, { args, text, usedPrefix, command }) => {
  try {
    if (!text) {
      return conn.sendMessage(
        m.chat,
        { text: `*Incorrect Usage:*\nExample: ${usedPrefix + command} <post-link> <emoji>\n\nExample: ${usedPrefix + command} https://whatsapp.com/channel/0029Va.../12345 🎉` },
        { quoted: m }
      );
    }

    const postUrl = args[0];
    const emojis = args.slice(1).join(" ");

    if (!postUrl || !emojis) {
      return conn.sendMessage(
        m.chat,
        { text: `*Invalid format!*\nCorrect format: ${usedPrefix + command} <post-link> <emoji>` },
        { quoted: m }
      );
    }
    
    // Simple URL validation for WhatsApp channels
    if (!postUrl.startsWith('https://whatsapp.com/channel/')) {
        return conn.sendMessage(
            m.chat,
            { text: `Please provide a valid WhatsApp Channel post link.` },
            { quoted: m }
        );
    }

    // Send initial processing message
    await conn.sendMessage(
      m.chat,
      { text: "⏳ Processing and attempting to send reactions..." },
      { quoted: m }
    );

    const result = await reactToWhatsAppPost(postUrl, emojis);

    if (result.success) {
      const data = result.data;

      const replyText =
        "*✅ Reaction Sent Successfully!* \n\n" +
        "• *Emoji:* " + data.emojis + "\n" +
        "• *Channel:* " + (data.postUrl || postUrl) + "\n" +
        "• *Remaining Coins:* " + data.remainingCoins;

      return conn.sendMessage(
        m.chat,
        { text: replyText },
        { quoted: m }
      );
    }

    // Failure case
    const errorDetails = typeof result.error === 'object' 
        ? JSON.stringify(result.error, null, 2) 
        : result.error;

    return conn.sendMessage(
      m.chat,
      {
        text:
          "❌ *Failed to Send Reaction* \n" +
          "• *Status:* " + (result.status || "N/A") + "\n" +
          "• *Error:* " + errorDetails
      },
      { quoted: m }
    );

  } catch (e) {
    console.error("[ReactWA Command Fatal Error]", e);
    conn.sendMessage(
      m.chat,
      { text: "❌ An unexpected error occurred. Please check the console." },
      { quoted: m }
    );
  }
});
