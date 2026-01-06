//---------------------------------------------------------------------------
//           KAMRAN-MD - RIMURU STYLISH BUTTON MENU
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const moment = require('moment-timezone');

cmd({
    pattern: "menu3",
    alias: ["murumenu", "help"],
    desc: "Main menu for Rimuru with buttons",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, sender, pushname, reply }) => {
    try {
        // 1️⃣ React loading ⏳
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // 2️⃣ Auto greeting (PKT Timezone)
        let hour = moment.tz('Asia/Karachi').hour();
        let greeting = 'Good night';
        if (hour >= 4 && hour < 11) greeting = 'Good morning';
        else if (hour >= 11 && hour < 15) greeting = 'Good afternoon';
        else if (hour >= 15 && hour < 18) greeting = 'Good evening';

        let caption = `
${greeting}, *${pushname || 'User'}!*
Hello I'm *Rimuru*, here is my information:

┏━━  *RIMURU INFO* ━━━━━━┓
┃ *✲ Bot name:* DRKAMRAN
┃ *彡 Developer:* Kamran & Ryuhan
┃ *❖ Version:* KAMRAN-MD
┃ *✾ Type:* Hybrid Plugin
┗━━━━━━━━━━━━━━━━━━━┛

Please select a category from the buttons below.
`.trim();

        // 3️⃣ Fake verified vCard
        const verifiedVcard = `
BEGIN:VCARD
VERSION:3.0
N:Rimuru;Verified;;;
FN:Rimuru Verified
ORG:RIMURU AI SYSTEM
TITLE:Tensura Interactive
TEL;waid=923154475891:+92 315-4475-891
END:VCARD`.trim();

        const fakeVerifiedQuote = {
            key: {
                remoteJid: '0@s.whatsapp.net',
                fromMe: false,
                participant: '0@s.whatsapp.net',
                id: 'RIMURU_VERIFIED'
            },
            message: {
                contactMessage: {
                    displayName: 'Rimuru Verified',
                    vcard: verifiedVcard
                }
            }
        };

        // 4️⃣ Button Construction
        const buttons = [
            { buttonId: '.allmenu', buttonText: { displayText: '📜 ALL MENU' }, type: 1 },
            { buttonId: '.owner', buttonText: { displayText: '👤 OWNER' }, type: 1 },
            { buttonId: '.ping', buttonText: { displayText: '⚡ PING' }, type: 1 }
        ];

        // 5️⃣ Send Menu with Buttons
        await conn.sendMessage(from, {
            image: { url: "https://i.pinimg.com/736x/8e/f4/63/8ef46399c585227d826227c95e99f0b1.jpg" },
            caption: caption,
            footer: 'KAMRAN - MD',
            buttons: buttons,
            headerType: 4,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: 'Rimuru Tempest AI',
                    body: 'Interactive KAMRAN Menu',
                    mediaType: 1,
                    sourceUrl: 'https://github.com/Kamran-MD',
                    thumbnailUrl: "https://i.pinimg.com/736x/8e/f4/63/8ef46399c585227d826227c95e99f0b1.jpg",
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: fakeVerifiedQuote });

        // 6️⃣ React finished 💧
        await conn.sendMessage(from, { react: { text: '💧', key: mek.key } });

    } catch (e) {
        console.error("Button Menu Error:", e);
        reply("❌ Button menu feature might be restricted on your WhatsApp version.");
    }
});
