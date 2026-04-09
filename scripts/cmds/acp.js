const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp", "ami", "valider"],
    version: "1.5",
    author: "Camille-Dev 🩵",
    countDown: 8,
    role: 2,
    shortDescription: "Gérer qui devient l'ami de Camille",
    longDescription: "Accepter ou refuser les demandes d'amis Facebook envoyées au bot.",
    category: "propriétaire",
    guide: {
      fr: "{pn} [add|del] [numéro|all]"
    }
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.trim().toLowerCase().split(/\s+/);

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    let actionType;
    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
      actionType = "𝗔𝗰𝗰𝗲𝗽𝘁𝗲́(𝗲)";
    } else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
      actionType = "𝗥𝗲𝗳𝘂𝘀𝗲́(𝗲)";
    } else {
      return api.sendMessage("❌ Vieux père, faut choisir : 'add' pour valider ou 'del' pour chasser.", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];
    const success = [];
    const failed = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 Demande #${stt} introuvable dans mon registre.`);
        continue;
      }
      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(user);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const results = await Promise.allSettled(promiseFriends);

    results.forEach((result, index) => {
      const user = newTargetIDs[index];
      if (result.status === "fulfilled" && !JSON.parse(result.value).errors) {
        success.push(`✅ ${actionType} : ${user.node.name}`);
      } else {
        failed.push(`❌ Échec pour : ${user.node.name}`);
      }
    });

    let replyMsg = `┏━━━━━ ⚖️ 𝗕𝗜𝗟𝗔𝗡 ━━━━━┓\n\n`;
    if (success.length > 0) replyMsg += success.join("\n") + "\n";
    if (failed.length > 0) replyMsg += failed.join("\n");
    replyMsg += `\n┗━━━━━━━━━━━━━━━━━━┛`;

    if (success.length || failed.length) api.sendMessage(replyMsg, event.threadID, event.messageID);
    else api.sendMessage("❌ Rien n'a été traité, le terrain est bizarre.", event.threadID);

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;

      if (!listRequest || listRequest.length === 0) {
        return api.sendMessage("✨ 𝗔𝗨𝗖𝗨𝗡 𝗗𝗥𝗔 : Personne ne cherche Camille pour le moment.", event.threadID);
      }

      let msg = "┏━━━━━ 🤝 𝗗𝗘𝗠𝗔𝗡𝗗𝗘𝗦 ━━━━━┓\n   𝗟𝗘𝗦 𝗠𝗢𝗚𝗢𝗦 𝗘𝗡 𝗔𝗧𝗧𝗘𝗡𝗧𝗘\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n";
      listRequest.forEach((user, index) => {
        msg += `💎  𝗡𝗼. ${index + 1}\n`;
        msg += `👤 Nom : ${user.node.name}\n`;
        msg += `🔗 Profil : ${user.node.url.replace("www.facebook", "fb")}\n`;
        msg += "──────────────────────\n";
      });

      msg += "\n💡 𝗧𝗔 𝗗𝗘́𝗖𝗜𝗦𝗜𝗢𝗡 :\n";
      msg += "✅ 𝗮𝗱𝗱 <numéro> — Valider le mogo\n";
      msg += "❌ 𝗱𝗲𝗹 <numéro> — Chasser le civil\n";
      msg += "🌟 𝗮𝗱𝗱 𝗮𝗹𝗹 — Tout valider (le Plateau !)\n";
      msg += "🔥 𝗱𝗲𝗹 𝗮𝗹𝗹 — Tout nettoyer\n\n";
      msg += "⏳ Camille ferme ce registre dans 2 min.";

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 2 * 60 * 1000)
        });
      }, event.messageID);

    } catch (error) {
      api.sendMessage("⚠️ Camille a eu un petit drap avec Facebook.", event.threadID);
    }
  }
};
  
