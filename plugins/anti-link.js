const { cmd } = require('../command');
const config = require('../config');

// Helper: Admin Check (Direct from participants to avoid ID mismatch)
const checkAdmin = (participants, user) => {
    const p = participants.find(p => p.id === user || p.id.replace(':3', '') === user.replace(':3', ''));
    return p ? (p.admin === "admin" || p.admin === "superadmin") : false;
};

cmd({ 
    on: "body" 
}, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // 1. Basic Safety Checks
        if (!isGroup || config.ANTI_LINK === 'false' || !body) return;

        // 2. Strict Filter: Sirf WhatsApp Group aur Channel Links detect honge
        const waLinkRegex = /(chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}|whatsapp\.com\/channel\/[a-zA-Z0-9]{20,})/gi;
        if (!waLinkRegex.test(body)) return;

        // 3. Admin & Bot Admin Check
        // Agar main context se admins mil rahe hain toh woh use karein, warna fetch karein
        let groupMetadata = await conn.groupMetadata(from);
        let participants = groupMetadata.participants;

        const isAdmin = checkAdmin(participants, sender);
        const isBotAdmin = checkAdmin(participants, conn.user.id.split(':')[0] + '@s.whatsapp.net') || checkAdmin(participants, conn.user.id);

        // Agar sender admin hai toh chor do
        if (isAdmin) return;
        
        // Agar bot admin nahi hai toh kuch nahi kar sakta
        if (!isBotAdmin) return;

        // 4. Action: Delete and Remove
        // Pehle delete karein taaki link gayab ho jaye
        await conn.sendMessage(from, { delete: m.key });

        // User ko remove karein
        await conn.groupParticipantsUpdate(from, [sender], "remove");

        // Warning/Notification
        await conn.sendMessage(from, { 
            text: `🚫 *Link Detected!* \n@${sender.split('@')[0]} has been removed for sharing WhatsApp Group/Channel links.`, 
            mentions: [sender] 
        });

    } catch (err) {
        console.error("Anti-link Error:", err.message);
    }
});

