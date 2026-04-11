const axios = require('axios')
const config = require('./config')
const {
  default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID, makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
  } = require(config.BAILEYS)
  
  const l = console.log
  const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
  const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
  const fs = require('fs')
  const ff = require('fluent-ffmpeg')
  const P = require('pino')
  const GroupEvents = require('./lib/groupevents');
  const { PresenceControl, BotActivityFilter } = require('./data/presence');
  const qrcode = require('qrcode-terminal')
  const StickersTypes = require('wa-sticker-formatter')
  const util = require('util')
  const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
  const FileType = require('file-type');
  const { File } = require('megajs')
  const { fromBuffer } = require('file-type')
  const bodyparser = require('body-parser')
  const os = require('os')
  const Crypto = require('crypto')
  const path = require('path')
  const prefix = config.PREFIX

  // --- STRICT OWNER SETTINGS ---
  const ownerNumber = ['923195068309'] 

  const express = require("express");
  const app = express();
  const port = process.env.PORT || 9090;

  const tempDir = path.join(os.tmpdir(), 'cache-temp')
  if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir) }
  const clearTempDir = () => {
      fs.readdir(tempDir, (err, files) => {
          if (err) throw err;
          for (const file of files) { fs.unlink(path.join(tempDir, file), err => { if (err) throw err; }); }
      });
  }
  setInterval(clearTempDir, 5 * 60 * 1000);

const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');
if (!fs.existsSync(sessionDir)) { fs.mkdirSync(sessionDir, { recursive: true }); }

async function loadSession() {
    try {
        if (!config.SESSION_ID) return null;
        const megaFileId = config.SESSION_ID.startsWith('IK~') ? config.SESSION_ID.replace("IK~", "") : config.SESSION_ID;
        const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
        const data = await new Promise((resolve, reject) => {
            filer.download((err, data) => { if (err) reject(err); else resolve(data); });
        });
        fs.writeFileSync(credsPath, data);
        return JSON.parse(data.toString());
    } catch (error) { return null; }
}

async function connectToWA() {
    console.log("[🔰] KAMRAN-MD Connecting...");
    const creds = await loadSession();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();
    
    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: !creds,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version,
        getMessage: async () => ({})
    });

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                setTimeout(connectToWA, 5000);
            }
        } else if (connection === 'open') {
            console.log('[✅] KAMRAN MD ONLINE');
            const upMsg = `*🚀 KAMRAN-MD V12 SYSTEM FIXED*\n\n- *Owner:* Dr. Kamran ✅\n- *Commands:* 100% Working ✅\n- *Mode:* ${config.MODE}\n\n_Sabh errors fix ho chuke hain._`;
            const inboxPath = conn.user.lid || (conn.user.id.includes(':') ? conn.user.id.split(':')[0] + "@s.whatsapp.net" : conn.user.id);
            setTimeout(async () => {
                await conn.sendMessage(inboxPath, { image: { url: `https://files.catbox.moe/ly6553.jpg` }, caption: upMsg });
            }, 5000);

            const pluginPath = path.join(__dirname, 'plugins');
            fs.readdirSync(pluginPath).forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() === ".js") { require(path.join(pluginPath, plugin)); }
            });
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async(mek) => {
        const m_raw = mek.messages[0];
        if (!m_raw.message) return;
        const from = m_raw.key.remoteJid;

        if (from === 'status@broadcast') {
            if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([m_raw.key]);
            return;
        }

        const m = sms(conn, m_raw);
        const type = getContentType(m_raw.message);
        const body = (type === 'conversation') ? m_raw.message.conversation : (type === 'extendedTextMessage') ? m_raw.message.extendedTextMessage.text : (type == 'imageMessage') && m_raw.message.imageMessage.caption ? m_raw.message.imageMessage.caption : (type == 'videoMessage') && m_raw.message.videoMessage.caption ? m_raw.message.videoMessage.caption : '';
        
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const q = args.join(' ');
        
        const sender = m_raw.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net') : (m_raw.key.participant || m_raw.key.remoteJid);
        const senderNumber = sender.replace(/[^0-9]/g, '');
        const botNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        
        // --- FINAL OWNER LOGIC ---
        const isOwner = ownerNumber.includes(senderNumber) || m_raw.key.fromMe || senderNumber === botNumber;
        const isCreator = isOwner; 

        if (config.MODE === "private" && !isOwner && isCmd) return;

        // Command handler logic
        const events = require('./command');
        if (isCmd) {
            const cmd = events.commands.find((c) => c.pattern === command) || events.commands.find((c) => c.alias && c.alias.includes(command));
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: m_raw.key }});
                
                const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
                const participants = isGroup ? await groupMetadata.participants : ''
                const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
                const isBotAdmins = isGroup ? groupAdmins.includes(botNumber + '@s.whatsapp.net') : false
                const isAdmins = isGroup ? groupAdmins.includes(sender) : false

                try {
                    await cmd.function(conn, m_raw, m, { 
                        from, body, isCmd, command, args, q, text: q, sender, isOwner, isCreator, isGroup, 
                        groupMetadata, participants, groupAdmins, isBotAdmins, isAdmins,
                        reply: (t) => conn.sendMessage(from, { text: t }, { quoted: m_raw }), ...mek 
                    });
                } catch (e) { console.error(e); }
            }
        } else if (config.AUTO_REACT === 'true') {
            const reactions = ['❤️', '🔥', '✨', '💯'];
            m.react(reactions[Math.floor(Math.random() * reactions.length)]);
        }
    });

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };
    
    conn.downloadMediaMessage = async (message) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
        return buffer
    };

    setInterval(() => { axios.get(`http://localhost:${port}`).catch(() => {}); }, 10 * 60 * 1000);
}

app.use(express.static(path.join(__dirname, 'lib')));
app.get('/', (req, res) => { res.redirect('/kamran.html'); });
app.listen(port, () => console.log(`Server listening on port ${port}`));
setTimeout(() => { connectToWA() }, 4000);
					
