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
        // --- PREPARE DATA ---
        const botName = config.BOT_NAME || "KAMRAN-MD";
        const ownerName = config.OWNER_NAME || "KAMRAN";
        const menuImg = config.MENU_IMAGE_URL || 'https://files.catbox.moe/ly6553.jpg';

        const menuCaption = `╭━━━〔 *${botName}* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👑 Owner : *${ownerName}*
┃★│ ⏳ Runtime : *${runtime(process.uptime())}*
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
📋 *ᴄʜᴏᴏsᴇ ᴀ ᴄᴀᴛᴇɢᴏʀʏ ᴛᴏ ᴇxᴘʟᴏʀᴇ:*
> _ʀᴇᴘʟʏ ᴡɪᴛʜ ᴛʜᴇ ᴍᴀᴛᴄʜɪɴɢ ɴᴜᴍʙᴇʀ_

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
> ${config.DESCRIPTION || "Multi-Device WhatsApp Bot"}`;

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: botName,
                body: `STATUS: ONLINE`,
                thumbnailUrl: menuImg,
                sourceUrl: 'https://whatsapp.com/channel/0029VaoS9S9K0IBoJ6L7O40B',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        };

        // --- SEND THE MAIN MENU ---
        const sentMsg = await conn.sendMessage(from, {
            image: { url: menuImg },
            caption: menuCaption,
            contextInfo: contextInfo
        }, { quoted: mek });

        const messageID = sentMsg.key.id;

        // --- CATEGORIES CONTENT ---
        const menuData = {
            '1': `╭━━━〔 *Download Menu* 〕━━━┈⊷\n• play [song]\n• video [url]\n• facebook [url]\n• tiktok [url]\n• insta [url]\n• apk [app]\n> ${botName}`,
            '2': `╭━━━〔 *Group Menu* 〕━━━┈⊷\n• mute/unmute\n• kick/add\n• promote/demote\n• tagall\n• hidetag\n• lockgc/unlockgc\n> ${botName}`,
            '3': `╭━━━〔 *Fun Menu* 〕━━━┈⊷\n• joke\n• fact\n• hack\n• rate\n• ship\n• character\n> ${botName}`,
            '4': `╭━━━〔 *Owner Menu* 〕━━━┈⊷\n• block/unblock\n• setpp\n• restart\n• shutdown\n> ${botName}`,
            '5': `╭━━━〔 *AI Menu* 〕━━━┈⊷\n• ai [query]\n• gpt [query]\n• imagine [text]\n> ${botName}`,
            '6': `╭━━━〔 *Anime Menu* 〕━━━┈⊷\n• waifu\n• neko\n• naruto\n• animegirl\n> ${botName}`,
            '7': `╭━━━〔 *Convert Menu* 〕━━━┈⊷\n• sticker\n• tomp3\n• fancy\n• tts\n• trt\n> ${botName}`,
            '8': `╭━━━〔 *Other Menu* 〕━━━┈⊷\n• weather\n• news\n• movie\n• calculate\n> ${botName}`,
            '9': `╭━━━〔 *Reactions Menu* 〕━━━┈⊷\n• hug\n• kiss\n• slap\n• kill\n• pat\n> ${botName}`,
            '10': `╭━━━〔 *Main Menu* 〕━━━┈⊷\n• ping\n• alive\n• runtime\n• repo\n• owner\n> ${botName}`
        };

        // --- REPLY HANDLER ---
        const handler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            
            if (isReplyToMenu) {
                const receivedText = (receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text || "").trim();
                const senderID = receivedMsg.key.remoteJid;

                if (menuData[receivedText]) {
                    await conn.sendMessage(senderID, {
                        image: { url: menuImg },
                        caption: menuData[receivedText],
                        contextInfo: contextInfo
                    }, { quoted: receivedMsg });
                    
                    await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
                }
            }
        };

        conn.ev.on("messages.upsert", handler);

        // Auto-kill listener after 5 minutes to save RAM
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        reply("❌ *ERROR:* Failed to load the menu. Check the console for logs.");
    }
});
            
