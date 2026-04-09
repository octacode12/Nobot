const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
 config: {
  name: "out",
  aliases: ["quitter", "degage", "foye"],
  version: "3.5",
  author: "Camille-Dev 🩵",
  countDown: 5,
  role: 2,
  category: "propriétaire"
 },

 onStart: async function ({ api, event, args }) {

  const id = !args.join(" ") ? event.threadID : args.join(" ");
  const ligne = "╼╼╼╼╼╼╼╼╼╼╼╼╼╼";

  const message = `
${ligne}
🔥 𝗟'𝗛𝗘𝗨𝗥𝗘 𝗗𝗨 𝗠𝗘́𝗣𝗥𝗜𝗦 🇨🇮 🔥
${ligne}

🤫 𝗖𝗮𝗺𝗶𝗹𝗹𝗲 𝘀'𝗲𝗻 𝘃𝗮, 𝗹𝗲 𝗻𝗶𝘃𝗲𝗮𝘂 𝘃𝗮 𝗰𝗵𝘂𝘁𝗲𝗿.

⚠️ 𝗔𝘃𝗶𝘀 𝗮̀ 𝗹𝗮 𝗽𝗼𝗽𝘂𝗹𝗮𝘁𝗶𝗼𝗻 :
On ne mélange pas serviette et torchon. 
Je quitte votre maquis bizarre là... 🏃‍♂️💨

🔥 𝗟𝗔 𝗣𝗘𝗧𝗜𝗧𝗘 𝗗𝗢𝗦𝗘 :
"Votre groupe a l'air d'un marché de garba sans piment."

😏 𝗗𝗜𝗔𝗚𝗡𝗢𝗦𝗧𝗜𝗖 :
Sans moi, vous allez fêter vos 0 messages par jour. 
C'est la famine qui vous attend ici ! 🦴

🚮 𝗗𝗘𝗥𝗡𝗜𝗘𝗥 𝗠𝗢𝗧 :
"Même mon code a eu pitié de vos discussions."

${ligne}
👋 𝗔𝗱𝗶𝗲𝘂 𝗹𝗲𝘀 𝗰𝗶𝘃𝗶𝗹𝘀 ! 
𝖢𝖺𝗆𝗂𝗅𝗅𝖾 𝗉𝖺𝗋𝗍 𝗀𝖾́𝗋𝖾𝗋 𝗅𝖾 𝖯𝗅𝖺𝗍𝖾𝖺𝗎, 𝗃𝖾 𝗏𝗈𝗎𝗌 𝗅𝖺𝗂𝗌𝗌𝖾 𝖽𝖺𝗇𝗌 𝗏𝗈𝗍𝗋𝖾 𝖻𝗋𝗼𝘂𝘀𝘀𝖾. ✌️
${ligne}
`;

  api.sendMessage(message, id, () => {
   api.removeUserFromGroup(api.getCurrentUserID(), id);
  });
 }
};
