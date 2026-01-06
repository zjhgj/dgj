const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')

cmd({
    pattern: "menu3",
    alias: ["murumenu", "help"],
    desc: "Main menu for Rimuru",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply, pushname }) => {
    try {
        let name = pushname || "User"

        // 1️⃣ React loading ⏳
        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        })

        // 2️⃣ Auto greeting WIB
        let hour = moment.tz('Asia/Jakarta').hour()
        let greeting = 'Selamat malam'
        if (hour >= 4 && hour < 11) greeting = 'Selamat pagi'
        else if (hour >= 11 && hour < 15) greeting = 'Selamat siang'
        else if (hour >= 15 && hour < 18) greeting = 'Selamat sore'

        let caption = `
${greeting}, *${name}!*
Hello I'm *Rimuru*, here is my information:

┏━━  *RIMURU INFO* ━━━━━━┓
┃ *✲ Bot name:* Rimuru
┃ *彡 Developer:* Ryuhan
┃ *❖ Baileys:* @ryuhan/baileys
┃ *✾ Type:* Plugins CJS
┗━━━━━━━━━━━━━━━━━━━┛

Silakan pilih menu di bawah
atau ketik perintah langsung.
`.trim()

        // Handle images (pastikan folder img dan filenya ada di bot kamu)
        let thumb1, thumb2
        try {
            thumb1 = fs.readFileSync('./img/thumbnail.jpg')
            thumb2 = fs.readFileSync('./img/thumbnail2.jpg')
        } catch (e) {
            // Fallback jika file tidak ditemukan agar bot tidak crash
            thumb1 = { url: 'https://i.pinimg.com/736x/8e/f4/63/8ef46399c585227d826227c95e99f0b1.jpg' }
            thumb2 = { url: 'https://i.pinimg.com/736x/8e/f4/63/8ef46399c585227d826227c95e99f0b1.jpg' }
        }

        // 3️⃣ Fake verified vCard
        const verifiedVcard = `
BEGIN:VCARD
VERSION:3.0
N:Rimuru;Verified;;;
FN:Rimuru Verified
ORG:RIMURU AI SYSTEM
TITLE:Tensura Interactive
TEL;waid=6285279522326:+62 852-7952-2326
END:VCARD
`.trim()

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
        }

        // 4️⃣ Kirim menu dengan buttons
        await conn.sendMessage(
            from,
            {
                image: thumb1,
                caption,
                footer: 'RIMURU - MD',
                buttons: [
                    { buttonId: '.allmenu', buttonText: { displayText: 'ıllı All Menu' }, type: 1 },
                    { buttonId: '.owner', buttonText: { displayText: '⏏ Owner' }, type: 1 },
                    { buttonId: '.ping', buttonText: { displayText: '⌗ Ping' }, type: 1 }
                ],
                headerType: 4,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 999,
                    externalAdReply: {
                        title: 'Rimuru Tempest',
                        body: 'Tensura Interactive',
                        thumbnail: thumb2,
                        sourceUrl: 'https://github.com/ryuhandev',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: fakeVerifiedQuote }
        )

        // 5️⃣ React selesai 💧
        await conn.sendMessage(from, {
            react: { text: '💧', key: mek.key }
        })

    } catch (e) {
        console.log(e)
        reply("Error: " + e.message)
    }
})
