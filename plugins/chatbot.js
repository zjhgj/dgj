const { cmd } = require("../command");
const config = require("../config");
const axios = require("axios");

// === AI Chatbot Event Handler ===
cmd({ on: "body" }, async (client, message, chat, { from, body, isGroup, isCmd }) => {
  try {
    // 1. LID & Identity Support
    const botId = client.user?.id || '';
    const botLid = client.user?.lid || '';
    
    const senderId = message.key.participant || message.key.remoteJid || (message.key.fromMe ? botId : null);

    // Identify if message is from the bot itself (Check both PN and LID)
    const isFromMe = message.key.fromMe || 
                     (botId && senderId === botId) || 
                     (botLid && senderId.split('@')[0] === botLid.split('@')[0]);

    // 2. SMART FILTERS: Only reply if AI is ON, it's NOT a command, NOT a group, and NOT from the bot itself
    if (config.AUTO_AI === "true" && !isCmd && !isGroup && !isFromMe && body) {
      
      // 3. Realistic "typing..." presence
      await client.sendPresenceUpdate('composing', from);

      // 4. Fetch response from David Cyril API (Using axios for better handling)
      const apiKey = ""; // Add your apikey here if required
      const apiUrl = `https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(body)}&apikey=${apiKey}`;
      
      const res = await axios.get(apiUrl);
      const data = res.data;

      if (data.status === 200 || data.success) {
        const aiReply = data.result;

        // 5. Send the smart reply with your brand styling
        await client.sendMessage(from, {
          text: `${aiReply}\n\n> © ᴋᴀᴍʀᴀɴ ᴍᴅ ᴀɪ 🤖`,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363418144382782@newsletter',
              newsletterName: '𝙆𝘼𝙈𝙍𝘼𝙉 𝙈𝘿',
              serverMessageId: 1700
            }
          }
        }, { quoted: message });
      }
    }
  } catch (error) {
    console.error("❌ Chatbot Error:", error);
  }
});

// === Chatbot Toggle Command ===
cmd({
  pattern: "chatbot",
  alias: ["autoi", "aichat"],
  desc: "Toggle Auto AI Chatbot feature",
  category: "owner",
  react: "🤖",
  filename: __filename,
  fromMe: true
},
async (client, message, m, { isOwner, from, sender, args }) => {
  try {
    if (!isOwner) {
      return client.sendMessage(from, {
        text: "🚫 *Owner-only command!*",
        mentions: [sender]
      }, { quoted: message });
    }

    const action = args[0]?.toLowerCase() || 'status';
    let statusText, reaction = "🤖", additionalInfo = "";

    switch (action) {
      case 'on':
        if (config.AUTO_AI === "true") {
          statusText = "📌 AI Chatbot is already *ENABLED*!";
          reaction = "ℹ️";
        } else {
          config.AUTO_AI = "true";
          statusText = "✅ AI Chatbot has been *ENABLED*!";
          reaction = "✅";
          additionalInfo = "I will now reply to all private messages 💬";
        }
        break;

      case 'off':
        if (config.AUTO_AI === "false") {
          statusText = "📌 AI Chatbot is already *DISABLED*!";
          reaction = "ℹ️";
        } else {
          config.AUTO_AI = "false";
          statusText = "❌ AI Chatbot has been *DISABLED*!";
          reaction = "❌";
          additionalInfo = "Auto-replies are now turned off 🔇";
        }
        break;

      default:
        statusText = `📌 Chatbot Status: ${config.AUTO_AI === "true" ? "✅ *ENABLED*" : "❌ *DISABLED*"}`;
        additionalInfo = config.AUTO_AI === "true" ? "Ready to chat 🤖" : "Standing by 💤";
        break;
    }

    // Send combined image + newsletter style message
    await client.sendMessage(from, {
      image: { url: "https://files.catbox.moe/tt88qy.jpg" },
      caption: `
${statusText}
${additionalInfo}

_𝙆𝘼𝙈𝙍𝘼𝙉 𝙈𝘿🌟_
      `,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363418144382782@newsletter',
            newsletterName: 'KAMRAN-MD',
            serverMessageId: 143
        }
      }
    }, { quoted: message });

    await client.sendMessage(from, {
      react: { text: reaction, key: message.key }
    });

  } catch (error) {
    console.error("❌ Chatbot command error:", error);
    await client.sendMessage(from, {
      text: `⚠️ Error: ${error.message}`,
      mentions: [sender]
    }, { quoted: message });
  }
});
