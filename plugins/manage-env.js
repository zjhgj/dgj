//---------------------------------------------------------------------------
//           KAMRAN-MD  
//---------------------------------------------------------------------------
//  ⚠️ LID & NEWSLETTER SUPPORT INTEGRATED - FULL VERSION ⚠️  
//---------------------------------------------------------------------------
const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions');
const { writeFileSync } = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const { setConfig, getConfig } = require("../lib/configdb");

/**
 * Advanced Admin Status Check with LID & PN Support
 */
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
        const senderNumber = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
        const senderIdWithoutSuffix = senderId.split('@')[0];
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';

                if (botId.includes(pId) || botLid === pLid || botNumber === pPhoneNumber) isBotAdmin = true;
                if (senderId.includes(pId) || senderIdWithoutSuffix === pLid || senderNumber === pPhoneNumber) isSenderAdmin = true;
            }
        }
        return { isBotAdmin, isSenderAdmin };
    } catch (err) {
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// Newsletter Context for professional branding
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

// --- CORE OWNER SETTINGS (IMAGE, NAME, PREFIX) ---

cmd({
  pattern: "setbotimage",
  alias: ["botdp", "botpic", "botimage"],
  desc: "Set the bot's image URL",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    let imageUrl = args[0];
    if (!imageUrl && m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");
      const mediaBuffer = await quotedMsg.download();
      const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}.jpg`);
      fs.writeFileSync(tempFilePath, mediaBuffer);
      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage.jpg`);
      form.append("reqtype", "fileupload");
      const response = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders() });
      fs.unlinkSync(tempFilePath);
      imageUrl = response.data;
    }
    if (!imageUrl || !imageUrl.startsWith("http")) return reply("❌ Invalid Image URL.");
    await setConfig("MENU_IMAGE_URL", imageUrl);
    await reply(`✅ Bot image updated.\n*URL:* ${imageUrl}\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
  } catch (err) { reply(`❌ Error: ${err.message}`); }
});

cmd({
  pattern: "setprefix",
  alias: ["prefix"],
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Owner only.");
  const newPrefix = args[0]?.trim();
  if (!newPrefix || newPrefix.length > 2) return reply("❌ Invalid Prefix.");
  await setConfig("PREFIX", newPrefix);
  await reply(`✅ Prefix updated to: *${newPrefix}*\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});

// --- SETTINGS TOGGLES (ARRAY DRIVEN FOR CLEANER CODE) ---

const toggleFeatures = [
    { pattern: "welcome", configKey: "WELCOME", react: "👋" },
    { pattern: "goodbye", configKey: "GOODBYE", react: "🏃" },
    { pattern: "anti-call", configKey: "ANTI_CALL", react: "📞" },
    { pattern: "autotyping", configKey: "AUTO_TYPING", react: "⌨️" },
    { pattern: "alwaysonline", configKey: "ALWAYS_ONLINE", react: "🌐" },
    { pattern: "autorecoding", configKey: "AUTO_RECORDING", react: "🎙️" },
    { pattern: "autostatusreact", configKey: "AUTO_STATUS_REACT", react: "❤️" },
    { pattern: "autostatusview", configKey: "AUTO_STATUS_SEEN", react: "👀" },
    { pattern: "read-message", configKey: "READ_MESSAGE", react: "📖" },
    { pattern: "antibad", configKey: "ANTI_BAD_WORD", react: "🚭" },
    { pattern: "autosticker", configKey: "AUTO_STICKER", react: "✨" },
    { pattern: "autoreply", configKey: "AUTO_REPLY", react: "🤖" },
    { pattern: "autoreact", configKey: "AUTO_REACT", react: "⚡" },
    { pattern: "autostatusreply", configKey: "AUTO_STATUS_REPLY", react: "💬" },
    { pattern: "mention-reply", configKey: "MENTION_REPLY", react: "mee" },
    { pattern: "admin-events", configKey: "ADMIN_ACTION", react: "⚙️" },
    { pattern: "ownerreact", configKey: "OWNER_REACT", react: "👑" },
    { pattern: "customreact", configKey: "CUSTOM_REACT", react: "😎" }
];

toggleFeatures.forEach(feat => {
    cmd({
        pattern: feat.pattern,
        alias: [feat.pattern.replace("-", ""), feat.react],
        category: "settings",
        filename: __filename
    }, async (conn, mek, m, { args, isCreator, reply }) => {
        if (!isCreator) return reply("*📛 OWNER ONLY!*");
        const status = args[0]?.toLowerCase();
        if (status === "on" || status === "off") {
            config[feat.configKey] = status === "on" ? "true" : "false";
            return reply(`✅ ${feat.pattern} turned ${status.toUpperCase()}.`);
        }
        return reply(`Usage: .${feat.pattern} on/off`);
    });
});

// --- GROUP SECURITY SETTINGS (LID PROTECTED) ---

const groupFeatures = [
    { pattern: "antilink", configKey: "ANTI_LINK", name: "Anti-Link" },
    { pattern: "antibot", configKey: "ANTI_BOT", name: "Anti-Bot" },
    { pattern: "deletelink", configKey: "DELETE_LINKS", name: "Delete-Link" }
];

groupFeatures.forEach(gfeat => {
    cmd({
        pattern: gfeat.pattern,
        category: "group",
        react: "🚫",
        filename: __filename
    }, async (conn, mek, m, { from, isGroup, args, sender, reply }) => {
        if (!isGroup) return reply('❌ Groups only.');
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isBotAdmin) return reply('❌ Bot must be Admin.');
        if (!isSenderAdmin) return reply('❌ You must be Admin.');
        
        const status = args[0]?.toLowerCase();
        if (status === "on" || status === "off") {
            config[gfeat.configKey] = status === "on" ? "true" : "false";
            await conn.sendMessage(from, { 
                text: `✅ ${gfeat.name} is now ${status.toUpperCase()}.`,
                contextInfo: newsletterContext 
            }, { quoted: mek });
        } else {
            reply(`Usage: .${gfeat.pattern} on/off`);
        }
    });
});

// --- CUSTOM EMOJIS ---

cmd({
  pattern: "setreacts",
  alias: ["emojis", "cemojis"],
  desc: "Set custom reaction emojis",
  category: "owner",
  react: "🌈",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Owner only.");
  const emojiList = args.join(" ").trim();
  if (!emojiList) return reply("❌ Provide emojis (comma separated).\nExample: .setreacts ❤️,🔥,✨");
  await setConfig("CUSTOM_REACT_EMOJIS", emojiList);
  await reply(`✅ Custom emojis updated.\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});

cmd({
    pattern: "mode",
    alias: ["setmode"],
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Owner only!*");
    const modeArg = args[0]?.toLowerCase();
    if (["private", "public"].includes(modeArg)) {
        setConfig("MODE", modeArg);
        await reply(`✅ Mode set to *${modeArg.toUpperCase()}*.\n♻ Restarting...`);
        setTimeout(() => exec("pm2 restart all"), 2000);
    } else {
        return reply("Usage: .mode private/public");
    }
});
