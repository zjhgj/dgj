const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');

//---------------------------------------------------------------------------
// AI COMMANDS
//---------------------------------------------------------------------------

cmd({
    pattern: "chatbot",
    alias: ["aichat"],
    desc: "Enable or disable AI chatbot",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.CHAT_BOT = "true";
      reply("✅ AI chatbot is now enabled.");
    } else if (args[0] === "off") {
      config.CHAT_BOT = "false";
      reply("❌ AI chatbot is now disabled.");
    } else {
      reply(`Example: ${prefix}chatbot on/off`);
    }
});
