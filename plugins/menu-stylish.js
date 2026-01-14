const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu",
    desc: "Show interactive menu system",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // --- 1. SET DEFAULTS (To prevent errors if config is missing) ---
        const botName = config.BOT_NAME || "KAMRAN-MD";
        const ownerName = config.OWNER_NAME || "KAMRAN";
        const menuImg = "https://files.catbox.moe/ly6553.jpg"; // Using a direct link to ensure it shows

        // --- 2. BUILD CAPTION ---
        const menuCaption = `╭━━━〔 *${botName}* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👑 Owner : *${ownerName}*
┃★│ ⏳ Runtime : *${runtime(process.uptime())}*
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
📋 *ᴄʜᴏᴏsᴇ ᴀ ᴄᴀᴛᴇɢᴏʀʏ:*
_Reply with the matching number_

 ➦✧ -〘 *ʙᴏᴛ ᴍᴇɴᴜ* 〙 -  ✧━┈⊷
┃✧│  ❶  *ᴅᴏᴡɴʟᴏᴅᴇᴅ ᴍᴇɴᴜ*
┃✧│  ❷  *ɢʀᴏᴜᴘ ᴍᴇɴᴜ*
┃✧│  ❸  *ғᴜɴ ᴍᴇɴᴜ*
┃✧│  ❹  *ᴏᴡɴᴇʀ ᴍᴇɴᴜ*
┃✧│  ❺  *ᴀɪ ᴍᴇɴᴜ*
┃✧│  ❻  *ᴀɴɪᴍᴇ ᴍᴇɴᴜ*
┃✧│  ❼  *ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ*
┃✧│  ❽  *ᴏᴛʜᴇʀ ᴍᴇɴᴜ*
┃✧│  ❾  *ʀᴇᴀᴄʏ ᴍᴇɴᴜ*
┃✧│  ❿  *ᴍᴀɪɴ ᴍᴇɴᴜ*
┃✧ ➥ ⋆⋆⋆⋆⋆⋆⋆⋆⋆⋆⋆⋆⋆⋆✧━┈⊷
> ${config.DESCRIPTION || "Powered by Kamran-MD"}`;

        // --- 3. SEND MENU WITH DP ---
        const sentMsg = await conn.sendMessage(from, {
            image: { url: menuImg },
            caption: menuCaption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: botName,
                    body: "SYSTEM ONLINE",
                    thumbnailUrl: menuImg,
                    sourceUrl: "https://github.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        // --- 4. DEFINE DATA ---
        const menuData = {
            '1': "📥 *DOWNLOAD MENU*\n\n• Play\n• Video\n• FB\n• Insta\n• Tiktok\n• APK",
            '2': "👥 *GROUP MENU*\n\n• Mute\n• Unmute\n• Tagall\n• Kick\n• Add\n• Promote",
            '3': "🎮 *FUN MENU*\n\n• Joke\n• Fact\n• Hack\n• Ship\n• Rate",
            '4': "👑 *OWNER MENU*\n\n• Restart\n• Shutdown\n• Block\n• Unblock\n• Setpp",
            '5': "🤖 *AI MENU*\n\n• AI\n• GPT\n• Imagine\n• Blackbox",
            '6': "🎎 *ANIME MENU*\n\n• Waifu\n• Neko\n• Naruto\n• Animegirl",
            '7': "🔄 *CONVERT MENU*\n\n• Sticker\n• ToMp3\n• Fancy\n• TTS",
            '8': "📌 *OTHER MENU*\n\n• Weather\n• News\n• Movie\n• Calculate",
            '9': "💞 *REACTION MENU*\n\n• Hug\n• Kiss\n• Slap\n• Kill\n• Pat",
            '10': "🏠 *MAIN MENU*\n\n• Ping\n• Alive\n• Runtime\n• Owner\n• Repo"
        };

        // --- 5. RESPONSE HANDLER ---
        const handler = async (msgData) => {
            const up = msgData.messages[0];
            if (!up.message) return;
            const text = (up.message.conversation || up.message.extendedTextMessage?.text || "").trim();
            const isReply = up.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReply && menuData[text]) {
                await conn.sendMessage(from, {
                    image: { url: menuImg },
                    caption: menuData[text] + `\n\n> ${botName}`,
                    contextInfo: { externalAdReply: { title: botName, mediaType: 1, thumbnailUrl: menuImg, renderLargerThumbnail: true } }
                }, { quoted: up });
                await conn.sendMessage(from, { react: { text: "✅", key: up.key } });
            }
        };

        conn.ev.on("messages.upsert", handler);
        setTimeout(() => conn.ev.off("messages.upsert", handler), 300000);

    } catch (e) {
        console.error(e);
        // Fallback to simple text if image fails
        reply("❌ DP failed to load, sending text menu:\n\n" + menuCaption);
    }
});
                    
