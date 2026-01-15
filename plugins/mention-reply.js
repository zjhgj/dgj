const config = require('../config');
const { cmd } = require('../command');

cmd({
  on: "body"
}, async (conn, m, { isGroup }) => {
  try {
    if (config.MENTION_REPLY !== 'true' || !isGroup) return;

    // --- LID & JID FIX FOR BOT IDENTIFICATION ---
    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';
    
    // Extract numeric parts to compare
    const botNumber = botId.split(":")[0].split("@")[0];
    const botLidNumeric = botLid ? botLid.split(":")[0].split("@")[0] : null;

    const mentioned = m.mentionedJid || [];
    
    // Check if any mentioned JID matches the Bot's ID or LID
    const isBotMentioned = mentioned.some(jid => {
        const jidPrefix = jid.split("@")[0].split(":")[0];
        return jid === botId || 
               jid === botLid || 
               jidPrefix === botNumber || 
               (botLidNumeric && jidPrefix === botLidNumeric);
    });

    if (!isBotMentioned) return;
    // --- END FIX ---

    const voiceClips = [
      "https://files.catbox.moe/0zjqy2.mp4",
      "https://files.catbox.moe/0zjqy2.mp4",
      "https://files.catbox.moe/0zjqy2.mp4",
      "https://files.catbox.moe/0zjqy2.mp4",
      "https://cdn.ironman.my.id/i/gr1jjc.mp4",
      "https://files.catbox.moe/986yyf.mp4",
      "https://files.catbox.moe/986yyf.mp4",
      "https://files.catbox.moe/986yyf.mp4",
      "https://files.catbox.moe/986yyf.mp4",
      "https://files.catbox.moe/986yyf.mp4"
    ];

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

    await conn.sendMessage(m.chat, {
      audio: { url: randomClip },
      mimetype: 'audio/mp4',
      ptt: true,
      waveform: [0, 99, 0, 99, 0, 99, 0], // Added better waveform effect
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
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4",
            "https://files.catbox.moe/0zjqy2.mp4"
        ];

        const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

        await conn.sendMessage(m.chat, {
            audio: { url: randomClip },
            mimetype: 'audio/mp4',
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
        await conn.sendMessage(m.chat, { text: "❌ Failed to send random clip." }, { quoted: m });
    }
});
