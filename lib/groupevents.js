// Credits DR KAMRAN - KAMRN-MD 💜 (MD Fixed)

const config = require('../config');

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        // ✅ MD structure read
        const { id, participants, action, author } = update;

        if (!id) return;

        const metadata = await conn.groupMetadata(id);
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString();

            // ✅ WELCOME
            if (action === "add" && config.WELCOME === "true") {
                const WelcomeText =
`╭─〔 *🤖 ${config.BOT_NAME}* 〕
├─▸ *Welcome @${userName} to ${metadata.subject}* 🎉
├─ *You are member number ${groupMembersCount}*
├─ *Time joined:* ${timestamp}
╰─➤ *Please read group description*

╭──〔 📜 *Group Description* 〕
├─ ${desc}
╰─🚀 *Powered by ${config.BOT_NAME}*`;

                await conn.sendMessage(id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [num]
                });
            }

            // ✅ GOODBYE
            else if (action === "remove" && config.GOODBYE === "true") {
                const GoodbyeText =
`╭─〔 *🤖 ${config.BOT_NAME}* 〕
├─▸ *Goodbye @${userName}* 😔
├─ *Time left:* ${timestamp}
├─ *Members remaining:* ${groupMembersCount}
╰─➤ *We'll miss you!*

╰─🚀 *Powered by ${config.BOT_NAME}*`;

                await conn.sendMessage(id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [num]
                });
            }

            // ✅ DEMOTE
            else if (action === "demote" && config.ADMIN_ACTION === "true" && author) {
                const demoter = author.split("@")[0];

                await conn.sendMessage(id, {
                    text:
`╭─〔 *⚠️ Admin Event* 〕
├─ @${demoter} demoted @${userName}
├─ *Time:* ${timestamp}
├─ *Group:* ${metadata.subject}
╰─➤ *Powered by ${config.BOT_NAME}*`,
                    mentions: [author, num]
                });
            }

            // ✅ PROMOTE
            else if (action === "promote" && config.ADMIN_ACTION === "true" && author) {
                const promoter = author.split("@")[0];

                await conn.sendMessage(id, {
                    text:
`╭─〔 *🎉 Admin Event* 〕
├─ @${promoter} promoted @${userName}
├─ *Time:* ${timestamp}
├─ *Group:* ${metadata.subject}
╰─➤ *Powered by ${config.BOT_NAME}*`,
                    mentions: [author, num]
                });
            }
        }

    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;
