const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
 config: {
  name: "out",
  aliases: ["l"],
  version: "3.0",
  author: "Camille 🩵",
  countDown: 5,
  role: 2,
  category: "blue lock"
 },

 onStart: async function ({ api, event, args }) {

  const id = !args.join(" ") ? event.threadID : parseInt(args.join(" "));

  const block = "█";

  const message = `
${block}${block}${block}${block}${block}${block}${block}${block}${block}${block}

⚽🔥 [FIN DU MATCH] 🔥⚽

👁️ Le bot quitte le terrain…

${block}${block}${block}

💀 Vous êtes abandonnés.
💬 Essayez de survivre sans moi… (bonne chance 😏)

${block}${block}${block}${block}${block}

🤣 Sérieusement… sans moi, ça va devenir un serveur de débutants.

${block}${block}${block}${block}${block}${block}

⚡ "Même Ego s’ennuie ici."

${block}${block}${block}${block}${block}${block}${block}${block}

👋 À plus… si vous survivez jusque-là.

${block}${block}${block}${block}${block}${block}${block}${block}${block}${block}
`;

  api.sendMessage(message, id, () => {
   api.removeUserFromGroup(api.getCurrentUserID(), id);
  });
 }
};
