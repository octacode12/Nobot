const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "developer",
    aliases: ["dev", "coder", "genie"],
    version: "1.0",
    author: "Camille-Dev 🩵",
    role: 0,
    description: {
      fr: "Gérer l'élite des codeurs (Ajouter, retirer, lister)",
      en: "Add, remove, list developer role users"
    },
    category: "propriétaire",
    guide: {
      fr: '   {pn} [add | -a] <uid | @tag> : Faire entrer un génie dans le cercle\n'
        + '   {pn} [remove | -r] <uid | @tag> : Chasser un codeur du cercle\n'
        + '   {pn} [list | -l] : Voir qui maîtrise le clavier ici'
    }
  },

  langs: {
    fr: {
      added: "┏━━━━━ 🦾 ━━━━━┓\n   𝗡𝗢𝗨𝗩𝗘𝗔𝗨 𝗚𝗘́𝗡𝗜𝗘\n┗━━━━━ 🦾 ━━━━━┛\n\n✅ Le cercle s'agrandit ! %1 nouveau(x) crack(s) ont rejoint l'élite :\n%2",
      alreadyDev: "⚠️ Calme-toi, ces %1 mogos là codent déjà avec nous :\n%2",
      missingIdAdd: "❌ Tu veux nommer qui comme génie ? Donne l'ID ou tag-le !",
      removed: "┏━━━━━ 🔌 ━━━━━┓\n   𝗗𝗘́𝗕𝗥𝗔𝗡𝗖𝗛𝗘́\n┗━━━━━ 🔌 ━━━━━┛\n\n✅ On a coupé le courant de %1 codeur(s). Ils retournent sur Scratch :\n%2",
      notDev: "⚠️ Ahiii ! Les %1 gars là n'ont jamais su coder ici :\n%2",
      missingIdRemove: "❌ Qui on doit chasser du serveur ? Donne son ID !",
      listDev: "┏━━━━━ 💻 ━━━━━┓\n   𝗟'𝗘́𝗟𝗜𝗧𝗘 𝗗𝗨 𝟮𝟮𝟱\n┗━━━━━ 💻 ━━━━━┛\n\nVoici ceux qui parlent couramment le langage de Camille 🇨🇮 :\n\n%1"
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang, role }) {
    
    if (!config.developer) config.developer = [];

    switch (args[0]) {
      case "add":
      case "-a": {
        // Seul le Créateur Suprême (Role 4 ou Camille) peut ajouter des cracks
        if (role < 4) return message.reply("✋ STOP ! Seul le Grand Architecte Camille peut nommer de nouveaux génies.");

        if (args[1] || event.messageReply) {
          let uids = [];
          if (Object.keys(event.mentions).length > 0)
            uids = Object.keys(event.mentions);
          else if (event.messageReply)
            uids.push(event.messageReply.senderID);
          else
            uids = args.filter(arg => !isNaN(arg));

          const notDevIds = [];
          const devIds = [];
          for (const uid of uids) {
            if (config.developer.includes(uid))
              devIds.push(uid);
            else
              notDevIds.push(uid);
          }

          config.developer.push(...notDevIds);
          const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          
          return message.reply(
            (notDevIds.length > 0 ? getLang("added", notDevIds.length, getNames.filter(n => notDevIds.includes(n.uid)).map(({ uid, name }) => `🔥 ${name} [${uid}]`).join("\n")) : "")
            + (devIds.length > 0 ? getLang("alreadyDev", devIds.length, devIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        }
        else
          return message.reply(getLang("missingIdAdd"));
      }

      case "remove":
      case "-r": {
        if (role < 4) return message.reply("✋ Doucement ! Tu n'as pas assez de force pour débrancher un génie.");

        if (args[1] || event.messageReply) {
          let uids = [];
          if (Object.keys(event.mentions).length > 0)
            uids = Object.keys(event.mentions);
          else if (event.messageReply)
            uids.push(event.messageReply.senderID);
          else
            uids = args.filter(arg => !isNaN(arg));

          const notDevIds = [];
          const devIds = [];
          for (const uid of uids) {
            if (config.developer.includes(uid))
              devIds.push(uid);
            else
              notDevIds.push(uid);
          }

          for (const uid of devIds)
            config.developer.splice(config.developer.indexOf(uid), 1);

          const getNames = await Promise.all(devIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          
          return message.reply(
            (devIds.length > 0 ? getLang("removed", devIds.length, getNames.map(({ uid, name }) => `🚶‍♂️ ${name} [${uid}]`).join("\n")) : "")
            + (notDevIds.length > 0 ? getLang("notDev", notDevIds.length, notDevIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        }
        else
          return message.reply(getLang("missingIdRemove"));
      }

      case "list":
      case "-l": {
        if (config.developer.length === 0)
          return message.reply("⚠️ Aucun génie trouvé... Tout le monde est civil ici ?");
        
        const getNames = await Promise.all(config.developer.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
        return message.reply(getLang("listDev", getNames.map(({ uid, name }) => `⚡ ${name} (${uid})`).join("\n")));
      }

      default:
        return message.SyntaxError();
    }
  }
};
        
