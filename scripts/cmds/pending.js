const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Infos du Grand Maître Camille
const ownerInfo = {
  name: "𝗖𝗔𝗠𝗜𝗟𝗟𝗘 🩵",
  facebook: "https://www.facebook.com/profile.php?id=61587455871434",
  telegram: "Ton Telegram ici",
  supportGroup: "Groupe Support Camille 🇨🇮"
};

module.exports = {
  config: {
    name: "pending",
    version: "2.5",
    author: "Camille-Dev 🩵",
    countDown: 5,
    role: 2,
    shortDescription: {
      fr: "Valider ou dégager les quartiers en attente"
    },
    longDescription: {
      fr: "Approuve les nouveaux groupes ou refuse-les avec chic."
    },
    category: "propriétaire"
  },

  langs: {
    fr: {
      invaildNumber: "❌ Le numéro %1 n'existe pas dans mes dossiers.",
      cancelSuccess: "✅ Déguerpissement réussi ! %1 quartier(s) ont été chassés.",
      approveSuccess: "✅ Accès accordé ! %1 quartier(s) sont maintenant sous ma protection.",
      cantGetPendingList: "⚠️ Impossible de consulter la liste d'attente pour le moment.",
      returnListPending:
        "┏━━━━━ 🛂 𝗔𝗧𝗧𝗘𝗡𝗧𝗘 ━━━━━┓\n   𝗖𝗢𝗡𝗧𝗥𝗢̂𝗟𝗘 𝗗'𝗔𝗖𝗖𝗘̀𝗦\n┗━━━━━━━━━━━━━━━━━━┛\n\nTotal en attente : %1 quartier(s)\n\n%2\n\n💡 𝗠𝗢𝗗𝗘 𝗗'𝗘𝗠𝗣𝗟𝗢𝗜 :\n👉 Approuver : Écris les numéros (ex: 1 2)\n👉 Refuser : Écris c [numéro] (ex: c 1)\n👉 Camille décide, les autres observent ! 🇨🇮",
      returnListClean: "✨ 𝗔𝗨𝗖𝗨𝗡 𝗗𝗥𝗔 : La liste est vide, tout est déjà validé."
    }
  },

  onReply: async function ({ api, event, Reply, getLang }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;
    const BOT_UID = api.getCurrentUserID();
    const API_ENDPOINT = "https://xsaim8x-xxx-api.onrender.com/api/botconnect";

    const lowerBody = body.trim().toLowerCase();

    // --- REFUSER (Déguerpir) ---
    if (lowerBody.startsWith("c") || lowerBody.startsWith("cancel")) {
      const trimmed = body.replace(/^(c|cancel)\s*/i, "").trim();
      const index = trimmed.split(/\s+/).filter(Boolean);

      if (index.length === 0) return api.sendMessage("❌ Vieux père, faut me dire quel numéro on doit dégager !", threadID, messageID);

      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length) {
          api.sendMessage(getLang("invaildNumber", i), threadID);
          continue;
        }

        const targetThreadID = Reply.pending[parseInt(i) - 1].threadID;
        try {
          await api.removeUserFromGroup(BOT_UID, targetThreadID);
          count++;
        } catch (error) {
          console.error(`⚠️ Échec du déguerpissement pour ${targetThreadID}`);
        }
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    }

    // --- APPROUVER (Connecter) ---
    else {
      const index = body.split(/\s+/).filter(Boolean);
      if (index.length === 0) return api.sendMessage("❌ Donne-moi au moins un numéro pour que j'ouvre la porte !", threadID, messageID);

      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length) {
          api.sendMessage(getLang("invaildNumber", i), threadID);
          continue;
        }

        const targetThread = Reply.pending[parseInt(i) - 1].threadID;
        const prefix = global.utils.getPrefix(targetThread);
        const nickNameBot = global.GoatBot.config.nickNameBot || "Camille-AI";

        try { await api.changeNickname(nickNameBot, targetThread, BOT_UID); } catch (err) {}

        try {
          const apiUrl = `${API_ENDPOINT}?botuid=${BOT_UID}&prefix=${encodeURIComponent(prefix)}`;
          const tmpDir = path.join(__dirname, "..", "cache");
          await fs.ensureDir(tmpDir);
          const imagePath = path.join(tmpDir, `connect_${targetThread}.png`);

          const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
          fs.writeFileSync(imagePath, response.data);

          const textMsg = [
            "✨ 𝗤𝗨𝗔𝗥𝗧𝗜𝗘𝗥 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘́ 𝗔𝗩𝗘𝗖 𝗦𝗨𝗖𝗖𝗘̀𝗦 🇨🇮",
            "──────────────────────",
            `🔹 𝐏𝐫𝐞𝐟𝐢𝐱 𝐝𝐮 𝐁𝐨𝐭: ${prefix}`,
            `🔸 𝐓𝐚𝐩𝐞𝐳: ${prefix}help 𝐩𝐨𝐮𝐫 𝐥𝐞𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐞𝐬`,
            "──────────────────────",
            "👑 𝗖𝗔𝗠𝗜𝗟𝗟𝗘 𝗘𝗦𝗧 𝗟𝗘 𝗕𝗢𝗦𝗦 𝗜𝗖𝗜 !",
            `🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: ${ownerInfo.facebook}`,
            `✈️ 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: ${ownerInfo.telegram}`,
            "──────────────────────",
            "⚠️ Comportez-vous bien, sinon le déguerpissement est immédiat."
          ].join("\n");

          await api.sendMessage({ body: textMsg, attachment: fs.createReadStream(imagePath) }, targetThread);
          fs.unlinkSync(imagePath);
        } catch (err) {
          api.sendMessage("✅ Connexion réussie ! Camille est dans la place. (Tapez .help)", targetThread);
        }
        count++;
      }
      return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
    }
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;
    let msg = "", index = 1;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const list = [...spam, ...pending].filter(g => g.isSubscribed && g.isGroup);

      for (const item of list) msg += `【 ${index++} 】 ${item.name}\n🆔 ${item.threadID}\n\n`;

      if (list.length !== 0) {
        return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              pending: list
            });
          }, messageID);
      } else {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  }
};
        
