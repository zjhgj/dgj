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
  const ownerNumber = ['923195068309']

  const express = require("express");
  const app = express();
  const port = process.env.PORT || 9090;

  const tempDir = path.join(os.tmpdir(), 'cache-temp')
  if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir) }
  
  const clearTempDir = () => {
      fs.readdir(tempDir, (err, files) => {
          if (err) throw err;
          for (const file of files) {
              fs.unlink(path.join(tempDir, file), err => { if (err) throw err; });
          }
      });
  }
  setInterval(clearTempDir, 5 * 60 * 1000);

const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');
if (!fs.existsSync(sessionDir)) { fs.mkdirSync(sessionDir, { recursive: true }); }

async function loadSession() {
    try {
        if (!config.SESSION_ID) return null;
        const megaFileId = config.SESSION_ID.replace("IK~", "");
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
            console.log('[✅] KAMRAN-MD ONLINE');
            
            // Startup Active Message
            const activeMsg = `*🚀 KAMRAN-MD V12 IS ACTIVE*\n\n*Prefix:* ${config.PREFIX}\n*Owner:* Dr. Kamran\n*Target:* 120363418144382782@newsletter\n\n_Bot 24/7 active rahega aur 6 ghante baad band nahi hoga._`;
            await conn.sendMessage(conn.user.id, { text: activeMsg });

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

        // --- 1. STATUS SEEN & REACT ---
        if (from === 'status@broadcast') {
            if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([m_raw.key]);
            if (config.AUTO_STATUS_REACT === "true") {
                const emojis = ['❤️', '🔥', '💯', '✨', '😎'];
                await conn.sendMessage(from, { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: m_raw.key } }, { statusJidList: [m_raw.key.participant, conn.user.id.split(':')[0] + '@s.whatsapp.net'] });
            }
            return;
        }

        // --- 2. CHANNEL REACT (Aapka Diya Gaya ID) ---
        if (from === '120363418144382782@newsletter') {
            if (config.AUTO_REACT === "true") {
                await conn.sendMessage(from, { react: { text: '✅', key: m_raw.key } });
            }
        }

        const m = sms(conn, m_raw);
        const type = getContentType(m_raw.message);
        const body = (type === 'conversation') ? m_raw.message.conversation : (type === 'extendedTextMessage') ? m_raw.message.extendedTextMessage.text : (type == 'imageMessage') && m_raw.message.imageMessage.caption ? m_raw.message.imageMessage.caption : (type == 'videoMessage') && m_raw.message.videoMessage.caption ? m_raw.message.videoMessage.caption : '';
        const isCmd = body.startsWith(prefix);
        const sender = m_raw.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net') : (m_raw.key.participant || m_raw.key.remoteJid);
        const senderNumber = sender.split('@')[0];
        const isOwner = ownerNumber.includes(senderNumber) || m_raw.key.fromMe;

        await saveMessage(m_raw);

        // Owner auto-react
        if (senderNumber.includes("923195068309") && !m.message.reactionMessage) {
            await m.react("👑");
        }

        // Command Handler
        const events = require('./command');
        const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
        if (isCmd) {
            const cmd = events.commands.find((c) => c.pattern === (cmdName)) || events.commands.find((c) => c.alias && c.alias.includes(cmdName));
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: m_raw.key }});
                try {
                    cmd.function(conn, m_raw, m, { from, body, isCmd, sender, isOwner, reply: (t) => conn.sendMessage(from, { text: t }, { quoted: m_raw }), ...mek });
                } catch (e) { console.error(e); }
            }
        }
    });

    conn.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            if (update.update.message === null) await AntiDelete(conn, updates);
        }
    });

    // --- RE-ADDING YOUR ORIGINAL FUNCTIONS ---
    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };

    conn.getName = (jid, withoutContact = false) => {
        jid = conn.decodeJid(jid);
        withoutContact = conn.withoutContact || withoutContact;
        let v;
        if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
            v = store.contacts[jid] || {};
            if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {};
            resolve(v.name || v.subject || jid.replace('@g.us', ''));
        });
        else v = jid === '0@s.whatsapp.net' ? { jid, name: 'WhatsApp' } : jid === jidNormalizedUser(conn.user.id) ? conn.user : store.contacts[jid] || {};
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || jid.replace('@s.whatsapp.net', '');
    };

    conn.sendContact = async (jid, list, quoted, opts = {}) => {
        let contacts = [];
        for (let i of list) {
            contacts.push({
                displayName: await conn.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${await conn.getName(i + '@s.whatsapp.net')};;;\nFN:${await conn.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem3.URL:https://github.com/kamran-md\nEND:VCARD`
            });
        }
        return conn.sendMessage(jid, { contacts: { displayName: `${contacts.length} Contact`, contacts }, ...opts }, { quoted });
    };

    // Heroku 6-hour Ping
    setInterval(() => {
        axios.get(`http://localhost:${port}`).catch(() => {});
    }, 10 * 60 * 1000);
}

app.use(express.static(path.join(__dirname, 'lib')));
app.get('/', (req, res) => { res.redirect('/kamran.html'); });
app.listen(port, () => console.log(`Server listening on port ${port}`));

setTimeout(() => { connectToWA() }, 4000);
					
