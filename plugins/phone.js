const { cmd } = require('../command');
const axios = require('axios');

/**
 * Scrapes WhatsApp Profile Public Info
 * @param {string} number - Phone number with country code
 */
async function WhatsAppProfile(number) {
    try {
        const url = `https://api.whatsapp.com/send/?phone=${number}&text&type=phone_number&app_absent=0&wame_ctl=1`;
        
        // Using axios instead of fetch for compatibility with most bot bases
        const { data: datana } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const waLink = `https://wa.me/${number}`;
        
        // Extract Name from Meta Title
        const nameMatch = datana.match(/<meta property="og:title" content="(.*?)" \/>/);
        let profileName = nameMatch ? nameMatch[1] : null;

        if (profileName) {
            profileName = profileName
                .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
                .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
                .replace(/&amp;/g, '&');
        }

        // Extract Profile Image
        const imageMatch = datana.match(/<meta property="og:image" content="(.*?)" \/>/);
        let profileImage = imageMatch ? imageMatch[1].replace(/&amp;/g, '&') : null;

        // Validation
        if (!profileName || profileName === "Bagikan di WhatsApp" || profileName === "Share on WhatsApp") {
            return { status: false, message: "Profile not found or Private." };
        }

        const finalImage = (profileImage && profileImage.includes('pps.whatsapp.net')) ? profileImage : null;

        return {
            status: true,
            data: {
                number: number,
                link: waLink,
                name: profileName,
                profile: finalImage || "No public profile picture"
            }
        };
    } catch (error) {
        return { status: false, message: error.message };
    }
}

// --- BOT COMMAND ---
cmd({
    pattern: "wainfo",
    alias: ["whois", "wauser"],
    desc: "Get public WhatsApp profile info of a number.",
    category: "tools",
    use: ".wainfo 923001234567",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❓ *Please provide a number with country code.*\nExample: `.wainfo 923001234567` (No + or spaces)");

        const targetNumber = q.replace(/[^0-9]/g, '');
        if (targetNumber.length < 10) return reply("❌ *Invalid number format.*");

        await conn.sendMessage(from, { react: { text: "🔍", key: m.key } });

        const result = await WhatsAppProfile(targetNumber);

        if (!result.status) {
            return reply(`❌ ${result.message}`);
        }

        const info = result.data;
        let responseMsg = `👤 *WHATSAPP PROFILE INFO*\n\n`;
        responseMsg += `📝 *Name:* ${info.name}\n`;
        responseMsg += `📞 *Number:* ${info.number}\n`;
        responseMsg += `🔗 *Link:* ${info.link}\n\n`;
        responseMsg += `*Powered by Knight Bot*`;

        if (info.profile && info.profile.startsWith('http')) {
            await conn.sendMessage(from, { 
                image: { url: info.profile }, 
                caption: responseMsg 
            }, { quoted: m });
        } else {
            reply(responseMsg + `\n🖼️ *Photo:* Not available publicly.`);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ An error occurred while fetching profile.");
    }
});
