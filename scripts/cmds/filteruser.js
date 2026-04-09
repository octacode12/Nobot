function sleep(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = {
	config: {
		name: "filteruser",
		version: "2.0",
		author: "Camille",
		countDown: 5,
		role: 1,
		description: {
			fr: "🔥 Pour balayer les gnatas et les comptes bousillés du groupe",
			en: "🔥 Sweep inactive and blocked accounts from the group"
		},
		category: "propriétaire",
		guide: {
			fr: "{pn} [<nombre de messages> | die]",
			en: "{pn} [<number of messages> | die]"
		}
	},

	langs: {
		fr: {
			needAdmin: "┏━━━━━ ⚠️ ━━━━━┓\n   𝗔𝗖𝗖𝗘̀𝗦 𝗥𝗘𝗙𝗨𝗦𝗘́\n┗━━━━━ ⚠️ ━━━━━┛\n\nVieux père, faut me mettre Admin d'abord ! 🙄 Je peux pas faire le travail de la police si j'ai pas mon badge, tu vois non ?",
			confirm: "┏━━━━━ 🔥 ━━━━━┓\n   𝗟𝗘 𝗚𝗥𝗔𝗡𝗗 𝗠𝗘́𝗡𝗔𝗚𝗘\n┗━━━━━ 🔥 ━━━━━┛\n\nDonc comme ça, tu veux chasser tous les mofos qui n'ont même pas atteint %1 messages ? 🧹\n\n👉 𝗙𝗮𝘂𝘁 𝗿𝗲́𝗮𝗴𝗶𝗿 𝗮𝘂 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 pour confirmer le balayage, sinon ils vont rester là à dormir... 😴",
			kickByBlock: "💀 [𝗔𝗨 𝗥𝗘𝗩𝗢𝗜𝗥 !]\n\nLes %1 plaisantins dont les comptes sont bloqués là, je les ai jetés dehors ! On veut pas de fantômes ici. 👻💨",
			kickByMsg: "🔥 [𝗚𝗡𝗔𝗧𝗔𝗦 𝗗𝗘𝗛𝗢𝗥𝗦 !]\n\nLes %1 petits qui font trop de 'vu' là (moins de %2 messages), on vient de les libérer ! ✌🏾 Allez vous amuser ailleurs !",
			kickError: "⚠️ [𝗬'𝗔 𝗗𝗥𝗔 !]\n\nJe n'ai pas pu chasser ces %1 personnes là :\n%2\n\nC'est comme s'ils ont fétiche, ça ne passe pas ! 🧙‍♂️",
			noBlock: "✅ [𝗧𝗢𝗨𝗧 𝗘𝗦𝗧 𝗣𝗥𝗢𝗣𝗥𝗘]\n\nAucun compte bloqué au quartier. Le terrain est dégagé ! 😎",
			noMsg: "✅ [𝗥𝗔𝗦, 𝗖'𝗘𝗦𝗧 𝗟𝗔 𝗙𝗔𝗠𝗜𝗟𝗟𝗘]\n\nY'a pas de gnatas avec moins de %1 messages ici... Pour l'instant, tout le monde est en haut ! 🚀"
		}
	},

	onStart: async function({ api, args, threadsData, message, event, commandName, getLang }) {
		const threadData = await threadsData.get(event.threadID);
		if (!threadData.adminIDs.includes(api.getCurrentUserID()))
			return message.reply(getLang("needAdmin"));

		if (!isNaN(args[0])) {
			message.reply(getLang("confirm", args[0]), (err, info) => {
				global.GoatBot.onReaction.set(info.messageID, {
					author: event.senderID,
					messageID: info.messageID,
					minimum: Number(args[0]),
					commandName
				});
			});
		} else if (args[0] == "die") {
			const threadInfo = await api.getThreadInfo(event.threadID);
			const membersBlocked = threadInfo.userInfo.filter(user => user.type !== "User");
			const errors = [];
			const success = [];
			for (const user of membersBlocked) {
				if (!threadData.adminIDs.some(id => id == user.id)) {
					try {
						await api.removeUserFromGroup(user.id, event.threadID);
						success.push(user.id);
					} catch (e) {
						errors.push(user.name);
					}
					await sleep(700);
				}
			}

			let msg = "";
			if (success.length) msg += `${getLang("kickByBlock", success.length)}\n`;
			if (errors.length) msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
			if (!msg) msg += getLang("noBlock");
			message.reply(msg);
		} else message.SyntaxError();
	},

	onReaction: async function({ api, Reaction, event, threadsData, message, getLang }) {
		const { minimum = 1, author } = Reaction;
		if (event.userID != author) return;

		const threadData = await threadsData.get(event.threadID);
		const botID = api.getCurrentUserID();
		const membersCountLess = threadData.members.filter(member =>
			member.count < minimum &&
			member.inGroup &&
			member.userID != botID &&
			!threadData.adminIDs.includes(member.userID)
		);

		const errors = [];
		const success = [];
		for (const member of membersCountLess) {
			try {
				await api.removeUserFromGroup(member.userID, event.threadID);
				success.push(member.userID);
			} catch (e) {
				errors.push(member.name);
			}
			await sleep(700);
		}

		let msg = "";
		if (success.length) msg += `${getLang("kickByMsg", success.length, minimum)}\n`;
		if (errors.length) msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
		if (!msg) msg += getLang("noMsg", minimum);
		message.reply(msg);
	}
};
					
