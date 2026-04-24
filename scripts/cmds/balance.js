const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash"],
    version: "5.2",
    author: "Christus",
    countDown: 3,
    role: 0,
    description: "💰 Système économique stylé avec transfert",
    category: "economy",
    guide: {
      fr: "{pn} - voir ton solde\n{pn} @utilisateur - voir le solde d'un autre\n{pn} t @utilisateur montant - transférer de l'argent"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;

    // 🔥 TON UID GOD MODE
    const GOD_UID = "61585694014120";

    // --- Formatage de l'argent ---
    const formatMoney = (amount) => {
      try {
        if (typeof amount === "bigint") {
          return amount.toString() + "$";
        }

        if (isNaN(amount)) return "0$";
        amount = Number(amount);

        const scales = [
          { value: 1e15, suffix: 'Q' },
          { value: 1e12, suffix: 'T' },
          { value: 1e9, suffix: 'B' },
          { value: 1e6, suffix: 'M' },
          { value: 1e3, suffix: 'k' }
        ];

        const scale = scales.find(s => amount >= s.value);
        if (scale) return `${(amount / scale.value).toFixed(1)}${scale.suffix}$`;

        return `${amount.toLocaleString()}$`;
      } catch {
        return "∞$";
      }
    };

    // --- Avatar ---
    const fetchAvatar = async (userID) => {
      try {
        let avatarURL = `https://graph.facebook.com/${userID}/picture?type=large&width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(avatarURL, { responseType: "arraybuffer", timeout: 10000 });
        return await loadImage(Buffer.from(res.data));
      } catch {
        const size = 100;
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#3b0066";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${size / 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", size / 2, size / 2);
        return canvas;
      }
    };

    // === TRANSFERT ===
    if (args[0]?.toLowerCase() === "t") {
      let targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amountRaw = args.find(a => !isNaN(a));
      const amount = parseFloat(amountRaw);

      if (!targetID || isNaN(amount)) return message.reply("❌ Usage : !bal t @utilisateur montant");
      if (targetID === senderID) return message.reply("❌ Vous ne pouvez pas vous envoyer de l'argent.");
      if (amount <= 0) return message.reply("❌ Montant invalide.");

      const sender = await usersData.get(senderID);
      const receiver = await usersData.get(targetID);

      // 🔒 Personne ne peut dépasser GOD
      if (targetID === GOD_UID) {
        return message.reply("⚠️ Impossible de donner de l'argent à ce joueur.");
      }

      const tax = Math.ceil(amount * 5 / 100);
      const total = amount + tax;

      if (sender.money < total) {
        return message.reply(`❌ Fonds insuffisants.\nBesoin : ${formatMoney(total)}`);
      }

      await Promise.all([
        usersData.set(senderID, { ...sender, money: sender.money - total }),
        usersData.set(targetID, { ...receiver, money: receiver.money + amount })
      ]);

      const receiverName = await usersData.getName(targetID);

      return message.reply(
        `✅ Transfert réussi !
➤ Vers : ${receiverName}
➤ Montant : ${formatMoney(amount)}
➤ Taxe : ${formatMoney(tax)}`
      );
    }

    // === CIBLE ===
    let targetID;
    if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
    else if (messageReply) targetID = messageReply.senderID;
    else targetID = senderID;

    const name = await usersData.getName(targetID);

    let money = await usersData.get(targetID, "money") || 0;

    // 💎 MODE DIEU
    if (targetID === GOD_UID) {
      money = BigInt("999999999999999999999999999999999999999999999999999999999999999999999999999999");
    }

    const avatar = await fetchAvatar(targetID);

    // === CANVAS ===
    const width = 700, height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f2027");
    gradient.addColorStop(1, "#2c5364");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(40, 40, width - 80, height - 80);

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    const avatarSize = 100;
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 180, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 70, 130, avatarSize, avatarSize);
    ctx.restore();

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⚡ Carte de Solde ⚡", width / 2, 80);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`💎 ${name}`, 200, 160);

    ctx.fillStyle = "#aaa";
    ctx.font = "20px Arial";
    ctx.fillText(`🆔 ${targetID}`, 200, 200);

    ctx.fillStyle = "#00FF7F";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${formatMoney(money)}`, width / 2, 250);

    const filePath = path.join(__dirname, "balance_card.png");
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    return message.reply({
      body: `⚡ Solde de ${name}`,
      attachment: fs.createReadStream(filePath)
    });
  }
};
