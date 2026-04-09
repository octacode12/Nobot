const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');
const { v4: uuidv4 } = require('uuid');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const YT_API = "http://65.109.80.126:20409/aryan/yx";
const EDIT_API = "https://gemini-edit-omega.vercel.app/edit";

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// 📥 Téléchargement Propre
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

// ♻️ Nettoyer la conversation (Reset)
const resetConversation = async (api, event, message) => {
  api.setMessageReaction("🧹", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply("┏━━━━━ ♻️ ━━━━━┓\n   𝗠𝗘́𝗡𝗔𝗚𝗘 𝗙𝗔𝗜𝗧\n┗━━━━━ ♻️ ━━━━━┛\n\nC'est propre ! Camille a tout effacé, on repart sur de nouvelles bases. 🇨🇮🩵");
  } catch (error) {
    return message.reply("❌ Ahiii ! Le balai est cassé, j'ai pas pu reset.");
  }
};

// 🎨 Fonction Edit (La touche artistique de Camille)
const handleEdit = async (api, event, message, args) => {
  const prompt = args.join(" ");
  if (!prompt) return message.reply("❗ Vieux père, faut dire à Camille ce qu'il doit dessiner !");

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  try {
    const params = { prompt };
    if (event.messageReply?.attachments?.[0]?.url) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const res = await axios.get(EDIT_API, { params });
    if (!res.data?.images?.[0]) throw new Error();

    const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");
    const imagePath = path.join(TMP_DIR, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    api.setMessageReaction("🎨", event.messageID, () => {}, true);
    await message.reply({ body: "✅ Voilà ton chef-d'œuvre, signé Camille :", attachment: fs.createReadStream(imagePath) });
    fs.unlinkSync(imagePath);
  } catch (error) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply("⚠️ Le pinceau de Camille a glissé... L'API refuse de dessiner.");
  }
};

// 🎬 Fonction YouTube
const handleYouTube = async (api, event, message, args) => {
  const option = args[0];
  if (!["-v", "-a"].includes(option)) {
    return message.reply("❌ Usage : .ai youtube [-v (vidéo) | -a (audio)] <titre ou URL>");
  }

  const query = args.slice(1).join(" ");
  if (!query) return message.reply("❌ Tu veux que Camille télécharge quoi ?");

  const sendFile = async (url, type) => {
    try {
      const { data } = await axios.get(`${YT_API}?url=${encodeURIComponent(url)}&type=${type}`);
      const downloadUrl = data.download_url;
      const filePath = path.join(TMP_DIR, `yt_${Date.now()}.${type}`);
      const writer = fs.createWriteStream(filePath);
      const stream = await axios({ url: downloadUrl, responseType: "stream" });
      stream.data.pipe(writer);
      await new Promise(r => writer.on("finish", r));
      await message.reply({ body: `✅ C'est prêt ! Gère ça proprement mogo !`, attachment: fs.createReadStream(filePath) });
      fs.unlinkSync(filePath);
    } catch (err) {
      message.reply("❌ Y'a eu un drap sur le téléchargement de Camille.");
    }
  };

  if (query.startsWith("http")) return await sendFile(query, option === "-v" ? "mp4" : "mp3");

  try {
    const results = (await ytSearch(query)).videos.slice(0, 6);
    if (results.length === 0) return message.reply("❌ Camille a cherché partout, y'a rien.");

    let list = "┏━━━━ 📺 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━━━┓\n\n";
    results.forEach((v, i) => { list += `${i + 1}. 🎬 ${v.title}\n`; });
    list += "\n┗━━━━━━━━━━━━━━━━━━┛\n💡 Réponds avec le chiffre (1-6) pour que Camille lance le chargement.";

    const thumbs = await Promise.all(results.map(v => axios.get(v.thumbnail, { responseType: "stream" }).then(res => res.data)));

    api.sendMessage({ body: list, attachment: thumbs }, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "ai", messageID: info.messageID, author: event.senderID, results, type: option
      });
    }, event.messageID);
  } catch (err) {
    message.reply("❌ Le réseau YouTube fatigue Camille aujourd'hui.");
  }
};

// 🧠 IA Principale (Le Cœur de Camille)
const handleAIRequest = async (api, event, userInput, message) => {
  const args = userInput.split(" ");
  const first = args[0]?.toLowerCase();

  if (["edit", "-e"].includes(first)) return await handleEdit(api, event, message, args.slice(1));
  if (["youtube", "yt", "ytb"].includes(first)) return await handleYouTube(api, event, message, args.slice(1));

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  let imageUrl = userInput.match(/(https?:\/\/[^\s]+)/)?.[0];
  let messageContent = userInput.replace(imageUrl || '', '').trim();

  try {
    const response = await axios.post(API_ENDPOINT, { uid: event.senderID, message: messageContent, image_url: imageUrl });
    let reply = response.data.reply || '...';
    
    // Remplacement du nom Shizu/Christus par Camille
    reply = reply
      .replace(/Shizu/gi, 'Camille')
      .replace(/Christus/gi, 'Camille')
      .replace(/Aryan Chauhan/gi, 'Camille-Dev');

    const attachments = [];
    if (response.data.image_url) {
      attachments.push(fs.createReadStream(await downloadFile(response.data.image_url, 'jpg')));
    }

    const sent = await message.reply({ body: `✨ 𝗖𝗔𝗠𝗜𝗟𝗟𝗘-𝗔𝗜 🇨🇮🩵 :\n──────────────────\n${reply}`, attachment: attachments });
    global.GoatBot.onReply.set(sent.messageID, { commandName: 'ai', messageID: sent.messageID, author: event.senderID });
    api.setMessageReaction("✅", event.messageID, () => {}, true);
  } catch (error) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("⚠️ Le cerveau de Camille a chauffé... L'API est KO.");
  }
};

module.exports = {
  config: {
    name: 'ai',
    version: '3.2.0',
    author: 'Camille-Dev 🩵',
    role: 0,
    category: 'ai',
    longDescription: { en: 'AI Multi-Outils par Camille : Chat, Images, YouTube et Retouches' },
    guide: {
      fr: `.ai [message] → Parler avec Camille  
.ai edit [texte] → Laisser Camille dessiner  
.ai youtube -v [titre] → Vidéo par Camille  
.ai youtube -a [titre] → Son par Camille  
.ai clear → Tout effacer`
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const input = args.join(' ').trim();
    if (!input) return message.reply("Ahiii ! Tu veux quoi ? Parle à Camille !");
    if (['clear', 'reset'].includes(input.toLowerCase())) return await resetConversation(api, event, message);
    return await handleAIRequest(api, event, input, message);
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) return;
    const body = event.body?.trim();
    if (!body) return;
    if (['clear', 'reset'].includes(body.toLowerCase())) return await resetConversation(api, event, message);
    
    if (Reply.results && Reply.type) {
      const idx = parseInt(body) - 1;
      if (idx < 0 || idx >= Reply.results.length) return message.reply("❌ Entre 1 et 6, Camille n'aime pas le bluff !");
      const type = Reply.type === "-v" ? "mp4" : "mp3";
      try {
        const { data } = await axios.get(`${YT_API}?url=${encodeURIComponent(Reply.results[idx].url)}&type=${type}`);
        const filePath = await downloadFile(data.download_url, type);
        await message.reply({ attachment: fs.createReadStream(filePath) });
        fs.unlinkSync(filePath);
      } catch { message.reply("❌ Camille n'a pas pu charger le fichier."); }
    } else {
      return await handleAIRequest(api, event, body, message);
    }
  }
};
          
