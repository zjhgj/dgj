const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const converter = require('../data/converter');

cmd({
  on: "body"
}, async (conn, m, { isGroup }) => {
  try {
    if (config.MENTION_REPLY !== 'true' || !isGroup) return;

    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';
    const botNumber = botId.split(":")[0].split("@")[0];

    const mentioned = m.mentionedJid || [];
    const isBotMentioned = mentioned.some(jid => jid.includes(botNumber) || jid === botId || jid === botLid);

    if (!isBotMentioned) return;

    const voiceClips = [
      "https://files.catbox.moe/0zjqy2.mp4",
      "https://cdn.ironman.my.id/i/gr1jjc.mp4",
      "https://files.catbox.moe/986yyf.mp4"
    ];

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

    // Fetching audio buffer using axios
    const response = await axios.get(randomClip, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'utf-8');
    const ptt = await converter.toPTT(buffer, 'mp4');

    await conn.sendMessage(m.chat, {
      audio: ptt,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
            title: "KAMRAN-MD VOICE REPLY",
            body: "Bot is active",
            mediaType: 1,
            renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error("Mention Reply Error:", e);
  }
});

cmd({
    pattern: "me",
    alias: ["mention", "broken", "x", "xd"],
    desc: "Send a random voice clip",
    category: "fun",
    react: "⚡",
    filename: __filename
}, async (conn, m) => {
    try {
        const voiceClips = [
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4"
        ];

        const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

        // Fetching audio buffer using axios
        const response = await axios.get(randomClip, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');
        const ptt = await converter.toPTT(buffer, 'mp4');

        await conn.sendMessage(m.chat, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD VOICE",
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: m });
    } catch (e) {
        console.error("Voice command error:", e);
        // Direct link fallback if converter fails
        const fallbackClips = ["https://files.catbox.moe/0zjqy2.mp4"];
        const fallback = fallbackClips[Math.floor(Math.random() * fallbackClips.length)];
        
        await conn.sendMessage(m.chat, { 
            audio: { url: fallback }, 
            mimetype: 'audio/mp4', 
            ptt: true 
        }, { quoted: m });
    }
});
  
