const fs = require('fs');
const path = require('path');
const axios = require('axios'); // node-fetch ki jagah axios use kiya hai kyunki upar import hai
const config = require('../config');    
const { cmd } = require('../command');
const converter = require('../data/converter'); // Converter logic integrated

cmd({
    pattern: "repo",
    alias: ["sc", "script", "info"],
    desc: "Fetch information about a GitHub repository.",
    react: "📂",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply }) => {
    const githubRepoURL = 'https://github.com/KAMRAN-SMD/KAMRAN-MD';

    try {
        // GitHub API fetch logic using axios
        const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
        const repoData = response.data;

        const formattedInfo = `*BOT NAME:*\n> ${repoData.name}\n\n*OWNER NAME:*\n> ᴋᴀᴍʀᴀɴ ᴍᴅ\n\n*STARS:*\n> ${repoData.stargazers_count}\n\n*FORKS:*\n> ${repoData.forks_count}\n\n*GITHUB LINK:*\n> ${repoData.html_url}\n\n*DESCRIPTION:*\n> ${repoData.description || 'World Best WhatsApp Bot powered by KAMRAN-MD'}\n\n*Don't Forget To Star and Fork Repository*\n\n> *𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃🖤*`;

        // 1. Send Image (Newsletter context ke sath)
        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || `https://files.catbox.moe/ly6553.jpg` },
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
        }, { quoted: mek });

        // 2. Send Audio (Converter use karke PTT bhejna)
        const audioPath = path.join(__dirname, '../assets/menu.m4a');
        
        if (fs.existsSync(audioPath)) {
            const buffer = fs.readFileSync(audioPath);
            
            // Converting buffer to PTT format (Bilkul aapke naye method ki tarah)
            const ptt = await converter.toPTT(buffer, 'm4a');

            await conn.sendMessage(from, {
                audio: ptt,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
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
            }, { quoted: mek });
        } else {
            console.log("Audio file menu1.m4a not found in assets");
        }

    } catch (error) {
        console.error("Repo command error:", error);
        reply("An error occurred while fetching repository info.");
    }
});
    
