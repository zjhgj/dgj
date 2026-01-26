const config = require('../config')
const {cmd , commands} = require('../command')
const os = require("os")
const {runtime} = require('../lib/functions')
const axios = require('axios')
const {sleep} = require('../lib/functions')
const fs = require('fs')
const path = require('path')

cmd({
    pattern: "repo",
    alias: ["sc", "script", "repository"],
    desc: "Fetch information about a GitHub repository.",
    react: "✅",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply }) => {
    const githubRepoURL = 'https://github.com/KAMRAN-SMD/KAMRAN-MD';

    try {
        // Extract username and repo name from the URL
        const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);

        // Fetch repository details using GitHub API
        const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
        const repoData = response.data;

        // Format the repository information
        const formattedInfo = `
*┏────〘 *REPO-INFO* 〙───⊷*
*┃* *📌 Repository Name:* ${repoData.name}
*┃* *👑 Owner:* ᴋᴀᴍʀᴀɴ ᴍᴅ
*┃* *⭐ Stars:* ${repoData.stargazers_count}
*┃* *⑂ Forks:* ${repoData.forks_count}
*┃* *📝 Description:* ${repoData.description || '*World Best WhatsApp Bot powered by KAMRAN-MD*'}
*┃* *🔗 GitHub Link:* ${repoData.html_url}
*┗──────────────⊷*
`.trim();

        // Send an image with the formatted info as a caption
        // 'dec' ko hata kar 'formattedInfo' kar diya hai
        await conn.sendMessage(
            from,
            {
                image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/ly6553.jpg' },
                caption: formattedInfo, 
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: config.BOT_NAME,
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

        // Audio send karne ka logic
        const audioPath = path.join(__dirname, '../assets/menu.m4a');
        if (fs.existsSync(audioPath)) {
            await conn.sendMessage(from, {
                audio: { url: audioPath },
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
            }, { quoted: mek });
        }

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
    
