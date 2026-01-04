//---------------------------------------------------------------------------
//           KAMRAN-MD - PINTEREST ALBUM SEARCH
//---------------------------------------------------------------------------
//  🚀 SEARCH PINTEREST & SEND IMAGES AS A NATIVE WHATSAPP ALBUM
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');
const {
    generateWAMessage,
    generateWAMessageFromContent,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { randomBytes } = require('crypto');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

cmd({
    pattern: "pinalbum",
    alias: ["pinterestalbum", "pinsearch"],
    desc: "Search Pinterest and send results as a grouped album.",
    category: "search",
    use: ".pinalbum furina",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    if (!text) return reply(`🔍 *Pinterest Search*\n\nUsage: \`${prefix + command} <query>\`\nExample: \`${prefix + command} nature aesthetics\``);

    await conn.sendMessage(from, { react: { text: "🕓", key: mek.key } });

    let urls = [];
    try {
        const url =
            "https://www.pinterest.com/resource/BaseSearchResource/get/?data=" +
            encodeURIComponent(
                JSON.stringify({
                    options: { query: encodeURIComponent(text) }
                })
            );

        const res = await fetch(url, {
            method: "HEAD",
            headers: {
                "screen-dpr": "4",
                "x-pinterest-pws-handler": "www/search/[scope].js"
            }
        });

        if (!res.ok) throw new Error(`Search failed with status ${res.status}`);

        const linkHeader = res.headers.get("Link");
        if (!linkHeader) throw new Error(`No results found for "${text}"`);

        // Extracting image links
        urls = [...linkHeader.matchAll(/<(.*?)>/gm)].map(a => a[1]);
    } catch (e) {
        return reply(`❌ *Error:* ${e.message}`);
    }

    const mediaList = [];
    // Limit to top 10 results for stability
    for (let url of urls) {
        if (mediaList.length >= 10) break;
        try {
            const r = await fetch(url, { redirect: "follow" });
            const type = r.headers.get("content-type") || "";
            if (!type.startsWith("image/")) continue;
            
            const buffer = await r.buffer();
            mediaList.push({
                image: buffer,
                caption: `✨ *Pinterest Result:* ${text}\n🚀 *Powered by KAMRAN-MD*`
            });
        } catch (err) {
            console.error("Fetch Error:", err.message);
        }
    }

    if (!mediaList.length) return reply("❌ No valid images found.");

    try {
        // Step 1: Create the Album Opener Message
        const opener = generateWAMessageFromContent(
            from,
            {
                messageContextInfo: { messageSecret: randomBytes(32) },
                albumMessage: {
                    expectedImageCount: mediaList.length,
                    expectedVideoCount: 0
                }
            },
            {
                userJid: jidNormalizedUser(conn.user.id),
                quoted: mek,
                upload: conn.waUploadToServer
            }
        );

        await conn.relayMessage(from, opener.message, { messageId: opener.key.id });

        // Step 2: Send each image associated with the parent Album
        for (let content of mediaList) {
            const msg = await generateWAMessage(from, content, {
                upload: conn.waUploadToServer
            });

            msg.message.messageContextInfo = {
                messageSecret: randomBytes(32),
                messageAssociation: {
                    associationType: 1, // Parent-Child Association
                    parentMessageKey: opener.key
                }
            };

            await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Album Relay Error:", e);
        reply("❌ Failed to send as Album. Your WhatsApp version might not support it.");
    }
});
