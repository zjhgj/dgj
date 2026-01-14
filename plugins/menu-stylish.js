const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "menu",
    desc: "Show interactive menu system",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // --- UPDATED CAPTION ---
        const menuCaption = `╭━━━〔 *${config.BOT_NAME}* 〕━━━┈⊷
┃★╭──────────────
┃★│ 👑 Owner : *${config.OWNER_NAME}*
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
> ${config.DESCRIPTION}`;

        // --- UPDATED CONTEXT INFO (FOR IMAGE/DP) ---
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: `${config.BOT_NAME} - INTERACTIVE MENU`,
                body: `Developed by ${config.OWNER_NAME}`,
                thumbnailUrl: config.MENU_IMAGE_URL || 'https://files.catbox.moe/ly6553.jpg',
                sourceUrl: 'https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O',
                mediaType: 1,
                renderLargerThumbnail: true
            },
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: config.OWNER_NAME,
                serverMessageId: 143
            }
        };

        // --- FIXED IMAGE SENDING LOGIC ---
        // Ensure image URL is valid
        const displayImage = config.MENU_IMAGE_URL && config.MENU_IMAGE_URL.startsWith('http') 
                             ? config.MENU_IMAGE_URL 
                             : 'https://files.catbox.moe/ly6553.jpg';

        const sentMsg = await conn.sendMessage(from, {
            image: { url: displayImage },
            caption: menuCaption,
            contextInfo: contextInfo
        }, { quoted: mek });

        // Optional Audio Send
        try {
            await conn.sendMessage(from, {
                audio: { url: 'https://files.catbox.moe/etattc.mp3' },
                mimetype: 'audio/mp4',
                ptt: true,
            }, { quoted: sentMsg });
        } catch (err) { console.log("Audio Error") }

        const messageID = sentMsg.key.id;

        // --- MENU CATEGORIES DATA (Same as before) ---
        const menuData = {
            '1': { content: `╭━━━〔 *Download Menu* 〕━━━┈⊷\n• play [song]\n• video [url]\n• facebook [url]\n• tiktok [url]\n• insta [url]\n• apk [app]\n• ytmp3/4 [url]\n> ${config.DESCRIPTION}` },
            '2': { content: `╭━━━〔 *Group Menu* 〕━━━┈⊷\n• mute/unmute\n• kick/add\n• promote/demote\n• tagall\n• hidetag\n• lockgc/unlockgc\n> ${config.DESCRIPTION}` },
            '3': { content: `╭━━━〔 *Fun Menu* 〕━━━┈⊷\n• joke\n• fact\n• hack\n• rate\n• ship\n• character\n> ${config.DESCRIPTION}` },
            '4': { content: `╭━━━〔 *Owner Menu* 〕━━━┈⊷\n• block/unblock\n• setpp\n• restart\n• shutdown\n• updatecmd\n> ${config.DESCRIPTION}` },
            '5': { content: `╭━━━〔 *AI Menu* 〕━━━┈⊷\n• ai [query]\n• gpt [query]\n• imagine [text]\n• blackbox [query]\n> ${config.DESCRIPTION}` },
            '6': { content: `╭━━━〔 *Anime Menu* 〕━━━┈⊷\n• waifu\n• neko\n• naruto\n• animegirl\n> ${config.DESCRIPTION}` },
            '7': { content: `╭━━━〔 *Convert Menu* 〕━━━┈⊷\n• sticker\n• tomp3\n• fancy\n• tts\n• trt\n> ${config.DESCRIPTION}` },
            '8': { content: `╭━━━〔 *Other Menu* 〕━━━┈⊷\n• weather\n• news\n• movie\n• define\n• calculate\n> ${config.DESCRIPTION}` },
            '9': { content: `╭━━━〔 *Reactions Menu* 〕━━━┈⊷\n• hug\n• kiss\n• slap\n• kill\n• pat\n• blush\n> ${config.DESCRIPTION}` },
            '10': { content: `╭━━━〔 *Main Menu* 〕━━━┈⊷\n• ping\n• alive\n• runtime\n• repo\n• owner\n> ${config.DESCRIPTION}` }
        };

        // --- HANDLER FOR REPLIES ---
        const handler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            
            if (isReplyToMenu) {
                const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
                const senderID = receivedMsg.key.remoteJid;

                if (menuData[receivedText]) {
                    await conn.sendMessage(senderID, {
                        image: { url: displayImage },
                        caption: menuData[receivedText].content,
                        contextInfo: contextInfo
                    }, { quoted: receivedMsg });
                    
                    await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
                }
            }
        };

        conn.ev.on("messages.upsert", handler);
        setTimeout(() => { conn.ev.off("messages.upsert", handler); }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        reply("❌ Menu load hone mein error aaya.");
    }
});
