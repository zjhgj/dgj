const config = require('../config');
const { cmd } = require('../command');

cmd({
  on: "body"
}, async (conn, m, { isGroup }) => {
  try {
    if (config.MENTION_REPLY !== 'true' || !isGroup) return;

    const mentioned = m.mentionedJid || [];
    const botNumber = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (!mentioned.includes(botNumber)) return;

    const voiceClips = [
      "https://files.catbox.moe/45wv9h.mp3",
      "https://files.catbox.moe/1jm58d.mp3",
      "https://files.catbox.moe/alvx4o.mp3",
      "https://files.catbox.moe/zu5igz.mp3",
      "https://files.catbox.moe/4m1ufp.mp3",
      "https://files.catbox.moe/45wv9h.mp3",
      "https://files.catbox.moe/niyhai.mp3",
      "https://files.catbox.moe/alvx4o.mp3",
      "https://files.catbox.moe/1jm58d.mp3",
      "https://files.catbox.moe/45wv9h.mp3"
    ];

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

    await conn.sendMessage(m.chat, {
      audio: { url: randomClip },
      mimetype: 'audio/mp4',
      ptt: true,
      waveform: [99, 0, 99, 0, 99],
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e);
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
      "https://files.catbox.moe/45wv9h.mp3",
      "https://files.catbox.moe/1jm58d.mp3",
      "https://files.catbox.moe/alvx4o.mp3",
      "https://files.catbox.moe/zu5igz.mp3",
      "https://files.catbox.moe/4m1ufp.mp3",
      "https://files.catbox.moe/45wv9h.mp3",
      "https://files.catbox.moe/niyhai.mp3",
      "https://files.catbox.moe/alvx4o.mp3",
      "https://files.catbox.moe/1jm58d.mp3",
      "https://files.catbox.moe/45wv9h.mp3"
    ];

        const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

        await conn.sendMessage(m.chat, {
            audio: { url: randomClip },
            mimetype: 'audio/mp3',
            ptt: true
        }, { quoted: m });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, { text: "❌ Failed to send random clip." }, { quoted: m });
    }
});
      
