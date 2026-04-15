const { isJidBroadcast, isJidGroup, isJidNewsletter } = require('@whiskeysockets/baileys');
const fs = require('fs/promises');
const path = require('path');

// Store directory setup
const storeDir = path.join(process.cwd(), 'store');

/**
 * JSON File Read Karne Ke Liye
 */
const readJSON = async (file) => {
  try {
    const filePath = path.join(storeDir, file);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    // Agar file nahi milti to folder banao aur empty array bhejo
    await fs.mkdir(storeDir, { recursive: true }).catch(() => {});
    return [];
  }
};

/**
 * JSON File Write Karne Ke Liye
 */
const writeJSON = async (file, data) => {
  try {
    const filePath = path.join(storeDir, file);
    await fs.mkdir(storeDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
  }
};

const saveContact = async (jid, name) => {
  if (!jid || !name || isJidGroup(jid) || isJidBroadcast(jid) || isJidNewsletter(jid)) return;
  const contacts = await readJSON('contact.json');
  const index = contacts.findIndex((contact) => contact.jid === jid);
  if (index > -1) {
    contacts[index].name = name;
  } else {
    contacts.push({ jid, name });
  }
  await writeJSON('contact.json', contacts);
};

const getContacts = async () => {
  return await readJSON('contact.json');
};

const saveMessage = async (message) => {
  if (!message?.key?.id || !message?.key?.remoteJid) return;
  const jid = message.key.remoteJid;
  const id = message.key.id;

  // Save contact logic
  const sender = message.key.participant || message.key.remoteJid;
  if (message.pushName) {
    await saveContact(sender, message.pushName);
  }

  const messages = await readJSON('message.json');
  const index = messages.findIndex((msg) => msg.id === id && msg.jid === jid);
  const timestamp = message.messageTimestamp ? message.messageTimestamp * 1000 : Date.now();

  if (index > -1) {
    messages[index].message = message;
    messages[index].timestamp = timestamp;
  } else {
    messages.push({ id, jid, message, timestamp });
  }

  // File size control (Keep last 1000 messages)
  if (messages.length > 1000) messages.shift();
  await writeJSON('message.json', messages);
};

const loadMessage = async (id) => {
  if (!id) return null;
  const messages = await readJSON('message.json');
  return messages.find((msg) => msg.id === id) || null;
};

const getName = async (jid) => {
  const contacts = await readJSON('contact.json');
  const contact = contacts.find((c) => c.jid === jid);
  return contact ? contact.name : jid.split('@')[0].replace(/_/g, ' ');
};

const saveGroupMetadata = async (jid, client) => {
  if (!isJidGroup(jid)) return;
  try {
    const groupMetadata = await client.groupMetadata(jid);
    const metadata = {
      jid: groupMetadata.id,
      subject: groupMetadata.subject,
      subjectOwner: groupMetadata.subjectOwner,
      subjectTime: groupMetadata.subjectTime ? new Date(groupMetadata.subjectTime * 1000).toISOString() : null,
      size: groupMetadata.size,
      creation: groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toISOString() : null,
      owner: groupMetadata.owner,
      desc: groupMetadata.desc,
      descId: groupMetadata.descId,
      linkedParent: groupMetadata.linkedParent,
      restrict: groupMetadata.restrict,
      announce: groupMetadata.announce,
      isCommunity: groupMetadata.isCommunity,
      isCommunityAnnounce: groupMetadata.isCommunityAnnounce,
      joinApprovalMode: groupMetadata.joinApprovalMode,
      memberAddMode: groupMetadata.memberAddMode,
      ephemeralDuration: groupMetadata.ephemeralDuration,
    };

    const metadataList = await readJSON('metadata.json');
    const index = metadataList.findIndex((meta) => meta.jid === jid);
    if (index > -1) {
      metadataList[index] = metadata;
    } else {
      metadataList.push(metadata);
    }
    await writeJSON('metadata.json', metadataList);

    const participants = groupMetadata.participants.map((p) => ({
      jid,
      participantId: p.id,
      admin: p.admin,
    }));
    await writeJSON(`${jid.split('@')[0]}_participants.json`, participants);
  } catch (error) {
    console.error("Error saving group metadata:", error);
  }
};

const getGroupMetadata = async (jid) => {
  if (!isJidGroup(jid)) return null;
  const metadataList = await readJSON('metadata.json');
  const metadata = metadataList.find((meta) => meta.jid === jid);
  if (!metadata) return null;

  const participants = await readJSON(`${jid.split('@')[0]}_participants.json`);
  return { ...metadata, participants };
};

const saveMessageCount = async (message) => {
  const jid = message.key.remoteJid;
  const sender = message.key.participant || message.sender || jid;
  if (!jid || !sender || !isJidGroup(jid)) return;

  const messageCounts = await readJSON('message_count.json');
  const index = messageCounts.findIndex((record) => record.jid === jid && record.sender === sender);

  if (index > -1) {
    messageCounts[index].count += 1;
  } else {
    messageCounts.push({ jid, sender, count: 1 });
  }
  await writeJSON('message_count.json', messageCounts);
};

const getInactiveGroupMembers = async (jid) => {
  if (!isJidGroup(jid)) return [];
  const groupMetadata = await getGroupMetadata(jid);
  if (!groupMetadata || !groupMetadata.participants) return [];

  const messageCounts = await readJSON('message_count.json');
  const inactiveMembers = groupMetadata.participants.filter((participant) => {
    const record = messageCounts.find((msg) => msg.jid === jid && msg.sender === participant.participantId);
    return !record || record.count === 0;
  });

  return inactiveMembers.map((member) => member.participantId);
};

const getGroupMembersMessageCount = async (jid) => {
  if (!isJidGroup(jid)) return [];
  const messageCounts = await readJSON('message_count.json');
  const groupCounts = messageCounts
    .filter((record) => record.jid === jid && record.count > 0)
    .sort((a, b) => b.count - a.count);

  return Promise.all(
    groupCounts.map(async (record) => ({
      sender: record.sender,
      name: await getName(record.sender),
      messageCount: record.count,
    }))
  );
};

const getChatSummary = async () => {
  const messages = await readJSON('message.json');
  if (messages.length === 0) return [];

  const distinctJids = [...new Set(messages.map((msg) => msg.jid))];

  const summaries = await Promise.all(
    distinctJids.map(async (jid) => {
      const chatMessages = messages.filter((msg) => msg.jid === jid);
      const messageCount = chatMessages.length;
      const lastMessage = chatMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
      const chatName = isJidGroup(jid) ? jid : await getName(jid);

      return {
        jid,
        name: chatName,
        messageCount,
        lastMessageTimestamp: lastMessage ? lastMessage.timestamp : null,
      };
    })
  );

  return summaries.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
};

const saveMessageV2 = async (message) => {
  await saveMessage(message);
  await saveMessageCount(message);
};

module.exports = {
  saveContact,
  getContacts,
  loadMessage,
  getName,
  getChatSummary,
  saveGroupMetadata,
  getGroupMetadata,
  saveMessageCount,
  getInactiveGroupMembers,
  getGroupMembersMessageCount,
  saveMessage: saveMessageV2,
};
      
