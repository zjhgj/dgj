const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd({
    pattern: "fakett",
    alias: ["faketiktok"],
    react: "🎬",
    desc: "Create a fake TikTok profile screenshot.",
    category: "maker",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Arguments parsing logic
        if (!q) {
            return reply(`*Example:*
➜ ${prefix + command} Kamran KamranMD 10 1M 5M
➜ Reply image with the command.

*Format:*
${prefix + command} name|username|following|followers|likes

*Parameters:*
• *name* : Display Name
• *username* : TikTok Username
• *following* : Following count
• *followers* : Followers count
• *likes* : Total likes`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Split using '|' or spaces
        let args = q.includes('|') ? q.split('|') : q.split(/\s+/);
        let [name, username, following, followers, likes, customUrl] = args.map(v => v?.trim());

        if (!name || !username || !following || !followers || !likes) {
            return reply(`❌ *Format Invalid!*\nExample: ${prefix + command} Kamran|KamranMD|100|10k|50k`);
        }

        let profileUrl = customUrl;

        // Step 1: Handle Image Upload if no URL provided
        if (!profileUrl) {
            if (!/image/.test(mime)) {
                return reply(`📸 *KAMRAN-MD:* Please reply to an image to use as profile picture.`);
            }

            const media = await quoted.download();
            const form = new FormData();
            form.append('files[]', media, { filename: 'pp.jpg' });

            const upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });

            profileUrl = upload.data.files[0].url;
        }

        // Step 2: API Request to Maker 
        const api = `https://api.zenzxz.my.id/maker/faketiktok?name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}&following=${encodeURIComponent(following)}&followers=${encodeURIComponent(followers)}&likes=${encodeURIComponent(likes)}&url=${encodeURIComponent(profileUrl)}`;

        const response = await axios.get(api, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');

        // Step 3: Send Final Image
        await conn.sendMessage(from, {
            image: buffer,
            caption: `🎭 *FAKE TIKTOK BY KAMRAN-MD*\n\n✨ *Name:* ${name}\n👤 *User:* @${username}\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ *Error:* Failed to generate fake profile. Server might be down.");
    }
});
                                            
