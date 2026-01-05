//---------------------------------------------------------------------------
//           KAMRAN-MD - GITHUB IMAGE UPLOADER (TOURL)
//---------------------------------------------------------------------------
//  🚀 UPLOAD IMAGES TO GITHUB REPO AND GET PERMANENT RAW LINKS
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// --- CONFIGURATION ---
// Replace these with your actual GitHub details
const GITHUB_CONFIG = {
    username: "RyzenXD-Sys",      // Your GitHub username
    repo: "Image",                // Your repository name
    folder: "Image",              // Folder inside repo (optional)
    token: "ghp_ctxxxxxxxx",      // Your GitHub Personal Access Token (PAT)
    branch: "main"                // Default branch
};

cmd({
    pattern: "uploadgh",
    alias: ["tourlgh", "ghupload"],
    desc: "Upload images to GitHub and get a raw URL.",
    category: "tools",
    use: ".uploadgh (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Validate Input
        if (!mime) return reply(`❌ Please reply to an image with \`${prefix + command}\``);
        if (!/image\/(jpe?g|png)/.test(mime)) return reply(`⚠️ Format not supported! Only JPG/PNG images are allowed.`);

        // Notification
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("⏳ *Uploading image to GitHub repository...*");

        // Download Media
        const media = await quoted.download();
        if (!media) throw new Error("Failed to download media from WhatsApp.");

        // File metadata
        const ext = mime.split('/')[1];
        const filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
        const filePath = GITHUB_CONFIG.folder ? `${GITHUB_CONFIG.folder}/${filename}` : filename;
        const contentBase64 = media.toString('base64');
        
        // GitHub API URL
        const apiUrl = `https://api-github-com.translate.goog/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${filePath}?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en&_x_tr_pto=wapp`;
        // Direct GitHub API (Used with token)
        const gitUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

        const response = await axios.put(gitUrl, {
            message: `KAMRAN-MD Upload: ${filename}`,
            content: contentBase64,
            branch: GITHUB_CONFIG.branch
        }, {
            headers: {
                "Authorization": `token ${GITHUB_CONFIG.token}`,
                "Content-Type": "application/json",
                "User-Agent": "KAMRAN-MD-Bot"
            }
        });

        if (response.status === 201 || response.status === 200) {
            // Construct Raw URL
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${filePath}`;
            
            const caption = `✅ *UPLOAD SUCCESSFUL* ✅\n\n` +
                          `👤 *User:* ${GITHUB_CONFIG.username}\n` +
                          `📂 *Repo:* ${GITHUB_CONFIG.repo}\n` +
                          `📄 *File:* ${filename}\n\n` +
                          `🔗 *Raw URL:*\n${rawUrl}\n\n` +
                          `*🚀 Powered by KAMRAN-MD*`;

            await conn.sendMessage(from, {
                image: { url: rawUrl },
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: "GITHUB IMAGE HOSTING",
                        body: "Image stored successfully",
                        mediaType: 1,
                        sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            throw new Error("GitHub API returned non-success status.");
        }

    } catch (e) {
        console.error("GitHub Upload Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        
        const errMsg = e.response?.data?.message || e.message;
        reply(`❌ *Upload Failed!*\n\n*Server Response:* ${errMsg}\n\n_Note: Check if your token, username, and repo name are correct in the config._`);
    }
});
