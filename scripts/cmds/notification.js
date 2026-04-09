const { getStreamsFromAttachment } = global.utils;

// Stockage temporaire pour notifications et réponses
const notificationMemory = {};
const adminReplies = {};

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti", "alerte"],
    version: "6.0",
    author: "Camille",
    countDown: 5,
    role: 2,
    category: "owner",
    shortDescription: "📢 Lance une nouvelle dans tous les quartiers (groupes)",
    longDescription: "Envoie un message stylé à tous les groupes et permet aux Vieux Pères de répondre au quartier.",
    guide: { fr: "{pn} <ton message>" },
    usePrefix: false,
    noPrefix: true
  },

  onStart: async function({ message, api, event, threadsData, envCommands, commandName, args }) {
    const { delayPerGroup = 300 } = envCommands[commandName] || {};
    if (!args[0]) return message.reply("Ahiii ! Tu veux annoncer quoi ? Écris le message d'abord ! 🙄");

    const allThreads = (await threadsData.getAll())
      .filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

    if (!allThreads.length) return message.reply("⚠️ Aucun quartier (groupe) trouvé dans ma liste.");

    message.reply(`⏳ Attache ton pagne, je lance la nouvelle dans ${allThreads.length} quartiers...`);

    let sendSuccess = 0;
    const sendError = [];

    for (const thread of allThreads) {
      let groupName = thread.name || "Quartier inconnu";
      
      const notificationBody = `
┏━━━━━━━ 🇨🇮 ━━━━━━━┓
   📢 𝗟𝗔 𝗡𝗢𝗨𝗩𝗘𝗟𝗟𝗘 𝗘𝗦𝗧 𝗟𝗔̀
┗━━━━━━━ 🇨🇮 ━━━━━━━┛
📍 𝗤𝘂𝗮𝗿𝘁𝗶𝗲𝗿 : ${groupName}

💬 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 :
${args.join(" ")}

───────────────────
📢 𝖱𝖾́𝗉𝗈𝗇𝖽𝖾𝗓 𝖺̀ 𝖼𝖾 𝗆𝖾𝗌𝗌𝖺𝗀𝖾 𝗉𝗈𝗎𝗋 𝗉𝖺𝗋𝗅𝖾𝗋 𝖺𝗎𝗑 𝖵𝗂𝖾𝗎𝗑 𝖯𝖾̀𝗋𝖾𝗌 !
      `.trim();

      const formSend = {
        body: notificationBody,
        attachment: await getStreamsFromAttachment([
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ])
      };

      try {
        const sentMsg = await api.sendMessage(formSend, thread.threadID);
        sendSuccess++;
        notificationMemory[`${thread.threadID}_${sentMsg.messageID}`] = { groupName };
        await new Promise(resolve => setTimeout(resolve, delayPerGroup));
      } catch (err) { sendError.push({ threadID: thread.threadID, groupName, error: err.message }); }
    }

    let bilan = `
╔════ 📝 𝗕𝗜𝗟𝗔𝗡 𝗗𝗨 𝗖𝗥𝗜𝗘𝗨𝗥 ════╗
✅ Quartiers informés : ${sendSuccess}
❌ Quartiers échoués : ${sendError.length}
`;
    if (sendError.length) {
        bilan += "────────────────────\n";
        sendError.forEach(err => { bilan += `📍 ${err.groupName} : Dra technique\n`; });
    }
    bilan += `╚══════════════════════╝`;
    message.reply(bilan.trim());
  },

  onMessage: async function({ api, event }) {
    if (!event.messageReply) return;

    const repliedMsgID = event.messageReply.messageID;
    const notificationKey = Object.keys(notificationMemory).find(key => key.endsWith(`_${repliedMsgID}`));
    if (!notificationKey) return;

    const { groupName } = notificationMemory[notificationKey];
    const userName = event.senderName || "Un mogo";
    const userID = event.senderID;

    const adminMessage = `
╔════ 🔔 𝗥𝗘́𝗣𝗢𝗡𝗦𝗘 𝗗𝗨 𝗣𝗘𝗧𝗜𝗧 ════╗
👤 𝗡𝗼𝗺 : ${userName}
🆔 𝗜𝗗 : ${userID}
📍 𝗤𝘂𝗮𝗿𝘁𝗶𝗲𝗿 : ${groupName}
──────────────────────────
💬 𝗜𝗹 𝗱𝗶𝘁 𝗾𝘂𝗲 :
${event.body}

💡 Vieux Père, réponds ici pour lui donner l'heure !
╚══════════════════════════╝
    `.trim();

    // On récupère les admins bot configurés dans global.GoatBot
    const adminIDs = global.GoatBot.config.adminBot;

    for (const adminID of adminIDs) {
      try {
        const sent = await api.sendMessage(adminMessage, adminID);
        adminReplies[sent.messageID] = {
          originalThreadID: event.threadID,
          userID
        };
      } catch {}
    }
  },

  onReply: async function({ api, event }) {
    const replyData = adminReplies[event.messageReply?.messageID];
    if (!replyData) return;

    const { originalThreadID, userID } = replyData;
    try {
      await api.sendMessage({
        body: `┏━━━━ 🇨🇮 𝗥𝗘́𝗣𝗢𝗡𝗦𝗘 𝗔𝗗𝗠𝗜𝗡 ━━━━┓\n\n${event.body}\n\n┗━━━━━━━━━━━━━━━━━━━━┛`
      }, originalThreadID || userID);
      // On ne delete pas forcément si on veut pouvoir continuer la discussion
    } catch (err) {
      api.sendMessage("❌ Impossible de livrer la réponse au petit.", event.threadID);
    }
  }
};
                        
