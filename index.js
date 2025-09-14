// const { Bot } = require("grammy");
// const gameManager = require("./games");

// const bot = new Bot(process.env.BOT_TOKEN);
// const MIN_PLAYERS = 2;

// // Helper to format turn order
// function formatTurnOrder(players) {
//     return players.map(p => p.name).join(" → ");
// }

// // Start a new game
// bot.command("startgame", (ctx) => {
//     const chatId = ctx.chat.id;
//     const starterId = ctx.from.id;
//     const starterName = ctx.from.first_name;

//     gameManager.startGame(chatId, starterId, starterName);
//     ctx.reply(`${starterName} started a Word Chain game! 🎮 Join using /join`);
// });

// // Join a game
// bot.command("join", (ctx) => {
//     const chatId = ctx.chat.id;
//     const userId = ctx.from.id;
//     const userName = ctx.from.first_name;

//     const game = gameManager.getGame(chatId);
//     if (!game) return ctx.reply("No active game! Start one with /startgame");

//     const added = gameManager.addPlayer(chatId, userId, userName);
//     if (!added) return ctx.reply(`${userName} is already in the game.`);

//     ctx.reply(`${userName} joined the game!`);

//     if (game.phase === "waiting" && game.players.length >= MIN_PLAYERS) {
//         game.phase = "playing";
//         gameManager.shufflePlayers(chatId);
//         game.currentTurnIndex = 0;

//         const turnOrder = formatTurnOrder(game.players);
//         ctx.reply(`Game starting with players: ${turnOrder}`);
//         const first = gameManager.currentPlayer(chatId);
//         ctx.reply(`First turn: ${first.name} (You have ${game.turnTime / 1000}s). Word can be any length ≥ ${game.minWordLength}`);
//         startTurnTimer(chatId, ctx);
//     } else if (game.phase === "playing") {
//         ctx.reply(`${userName} joined mid-game! They will play after current players.`);
//     }
// });

// // Handle word submissions
// bot.on("message:text", async (ctx) => {
//     const text = ctx.message.text.trim();
//     if (text.startsWith("/")) return; // ignore commands

//     const chatId = ctx.chat.id;
//     const userId = ctx.from.id;
//     const word = text.toLowerCase();

//     const game = gameManager.getGame(chatId);
//     if (!game || game.phase !== "playing") return;

//     const player = game.players.find(p => p.id === userId);
//     if (!player) return;

//     const current = gameManager.currentPlayer(chatId);
//     if (current.id !== userId) return ctx.reply(`⛔ It's not your turn! Next: ${current.name}`);

//     // Validate word length
//     if (word.length < game.minWordLength) return ctx.reply(`❌ Word too short! Minimum length: ${game.minWordLength}`);

//     // First word
//     if (!game.lastWord) {
//         const isValid = await gameManager.validateWord(word);
//         if (!isValid) return ctx.reply("❌ Not a valid English word!");
//         gameManager.addWord(chatId, userId, word);
//         ctx.reply(`✅ ${word} accepted! Next must start with: '${word.slice(-1)}'`);
//         if (game.timer) clearTimeout(game.timer);
//         nextPlayerTurn(chatId, ctx);
//         return;
//     }

//     // Subsequent turns
//     if (word[0] !== game.lastWord.slice(-1)) return ctx.reply(`❌ Invalid! Word should start with: '${game.lastWord.slice(-1)}'`);
//     if (game.usedWords.has(word)) return ctx.reply("❌ Word already used!");
//     const isValid = await gameManager.validateWord(word);
//     if (!isValid) return ctx.reply("❌ Not a valid English word!");

//     gameManager.addWord(chatId, userId, word);
//     ctx.reply(`✅ Accepted! Next must start with: '${word.slice(-1)}'`);
//     if (game.timer) clearTimeout(game.timer);
//     nextPlayerTurn(chatId, ctx);
// });

// // Player flee
// bot.command("flee", (ctx) => {
//     const chatId = ctx.chat.id;
//     const userId = ctx.from.id;
//     const game = gameManager.getGame(chatId);
//     if (!game || game.phase !== "playing") return ctx.reply("No active game to flee from.");

//     const player = game.players.find(p => p.id === userId);
//     if (!player) return ctx.reply("You are not in the game.");

//     gameManager.removePlayer(chatId, userId);
//     ctx.reply(`${player.name} has left the game.`);

//     if (game.players.length === 1) {
//         const winner = game.players[0];
//         ctx.reply(`🏆 ${winner.name} is the winner!`);
//         gameManager.endGame(chatId);
//     } else {
//         if (game.currentTurnIndex >= game.players.length) game.currentTurnIndex = 0;
//         const current = gameManager.currentPlayer(chatId);
//         ctx.reply(`Next turn: ${current.name}. Word must start with: '${game.lastWord.slice(-1)}'`);
//         if (game.timer) clearTimeout(game.timer);
//         startTurnTimer(chatId, ctx);
//     }
// });

// // End game manually
// bot.command("endgame", (ctx) => {
//     const chatId = ctx.chat.id;
//     const game = gameManager.getGame(chatId);
//     if (!game) return ctx.reply("No active game!");
//     gameManager.endGame(chatId);
//     ctx.reply("Game ended manually.");
// });

// // Turn timer
// function startTurnTimer(chatId, ctx) {
//     const game = gameManager.getGame(chatId);
//     if (!game) return;

//     const current = gameManager.currentPlayer(chatId);
//     const lastLetter = game.lastWord ? game.lastWord.slice(-1) : "-";
//     ctx.reply(`⏱ ${current.name}, your turn! You have ${game.turnTime / 1000}s. Word must start with: '${lastLetter}'. Minimum length: ${game.minWordLength}`);

//     game.timer = setTimeout(() => {
//         ctx.reply(`${current.name} ran out of time and is eliminated! ❌`);
//         gameManager.removePlayer(chatId, current.id);

//         if (game.players.length === 1) {
//             const winner = game.players[0];
//             ctx.reply(`🏆 ${winner.name} is the winner!`);
//             gameManager.endGame(chatId);
//         } else {
//             nextPlayerTurn(chatId, ctx);
//         }
//     }, game.turnTime);
// }

// // Move to next turn and handle rounds
// function nextPlayerTurn(chatId, ctx) {
//     const game = gameManager.getGame(chatId);
//     if (!game) return;

//     gameManager.nextTurn(chatId);

//     // Check if round completed
//     if (game.currentTurnIndex === 0) {
//         game.roundsCompleted++;
//         if (game.roundsCompleted % 2 === 0) adjustDifficulty(chatId, ctx);
//     }

//     startTurnTimer(chatId, ctx);
// }

// // Adjust difficulty
// function adjustDifficulty(chatId, ctx) {
//     const game = gameManager.getGame(chatId);
//     if (!game) return;

//     game.turnTime = Math.max(10000, game.turnTime - 5000);
//     game.minWordLength = (game.minWordLength || 3) + 1;

//     ctx.reply(`⚡ Difficulty increased! Turn time: ${game.turnTime / 1000}s. Minimum word length: ${game.minWordLength}`);
// }

// // Start the bot
// bot.start({ webhook: false });
// console.log("Word Chain Bot running...");






// v2 working code
// const { Bot } = require("grammy");
// const gameManager = require("./games");

// const bot = new Bot(process.env.BOT_TOKEN);
// const MIN_PLAYERS = 2;

// // --- Helpers ---
// function formatTurnOrder(players) {
//   return players.map(p => p.name).join(" → ");
// }

// function announceTurn(ctx, game, extra = "") {
//   const current = game.players[game.currentTurnIndex];
//   const lastLetter = game.lastWord ? game.lastWord.slice(-1).toUpperCase() : "Start with any word";

//   const mention = `<a href="tg://user?id=${current.id}">${current.name}</a>`;

// //   🎯 Turn: ${current.name}


//   const msg = `➡️ Round ${game.round}
//  🎯 Turn: ${mention}
// ⏱ Time: ${game.timeLimit / 1000}s
// 🔤 Word must start with: '${lastLetter}', min length: ${game.minLength}
// ${extra}`;
//   ctx.reply(msg, { parse_mode: "HTML" });
// }

// // --- Turn Timer ---
// function startTurnTimer(chatId, ctx) {
//   const game = gameManager.getGame(chatId);
//   if (!game || game.players.length === 0) return;

//   // Clear previous timer
//   if (game.timer) clearTimeout(game.timer);

//   const current = gameManager.currentPlayer(chatId);
//   announceTurn(ctx, game);

//   // Capture current player for closure
//   const player = { ...current };

//   game.timer = setTimeout(() => {
//     ctx.reply(`${player.name} ran out of time ❌`);
//     gameManager.removePlayer(chatId, player.id);
//     game.eliminated.add(player.id);

//     // Check game end
//     if (game.players.length === 1) {
//       ctx.reply(`🏆 ${game.players[0].name} wins!`);
//       gameManager.endGame(chatId);
//       return;
//     } else if (game.players.length === 0) {
//       ctx.reply(`No players left. Game over ❌`);
//       gameManager.endGame(chatId);
//       return;
//     }

//     // Move to next turn
//     gameManager.nextTurn(chatId);
//     startTurnTimer(chatId, ctx);

//   }, game.timeLimit);
// }

// // --- Commands ---
// bot.command("startgame", ctx => {
//   const chatId = ctx.chat.id;
//   const starterId = ctx.from.id;
//   const starterName = ctx.from.first_name;

//   gameManager.startGame(chatId, starterId, starterName);
//   ctx.reply(`${starterName} started a Word Chain game! 🎮 Join with /join`);
// });

// bot.command("join", ctx => {
//   const chatId = ctx.chat.id;
//   const userId = ctx.from.id;
//   const userName = ctx.from.first_name;

//   const game = gameManager.getGame(chatId);
//   if (!game) return ctx.reply("No active game! Start one with /startgame");
//   if (game.eliminated.has(userId)) return ctx.reply(`${userName}, you were eliminated ❌`);

//   const added = gameManager.addPlayer(chatId, userId, userName);
//   if (!added) return ctx.reply(`${userName} is already in the game.`);

//   if (game.phase === "waiting") {
//     ctx.reply(`${userName} joined! Players: ${formatTurnOrder(game.players)}`);

//     if (game.players.length >= MIN_PLAYERS) {
//       game.phase = "playing";
//       gameManager.shufflePlayers(chatId);
//       ctx.reply(`✅ Game starting!\nTurn order: ${formatTurnOrder(game.players)}`);
//       startTurnTimer(chatId, ctx);
//     }
//   } else {
//     ctx.reply(`${userName} joined mid-game! They’ll join next round.`);
//   }
// });

// bot.command("flee", ctx => {
//   const chatId = ctx.chat.id;
//   const userId = ctx.from.id;
//   const game = gameManager.getGame(chatId);
//   if (!game || game.phase !== "playing") return ctx.reply("No active game to flee from.");

//   const player = game.players.find(p => p.id === userId);
//   if (!player) return ctx.reply("You are not in the game.");

//   gameManager.removePlayer(chatId, userId);
//   ctx.reply(`${player.name} left the game ❌`);

//   if (game.players.length === 1) {
//     ctx.reply(`🏆 ${game.players[0].name} wins!`);
//     gameManager.endGame(chatId);
//   } else if (game.players.length > 1) {
//     startTurnTimer(chatId, ctx);
//   }
// });

// bot.command("endgame", ctx => {
//   const chatId = ctx.chat.id;
//   const game = gameManager.getGame(chatId);
//   if (!game) return ctx.reply("No active game!");
//   gameManager.endGame(chatId);
//   ctx.reply("Game ended manually.");
// });

// // --- Word handler ---
// bot.on("message:text", async ctx => {
//   const text = ctx.message.text.trim();
//   if (text.startsWith("/")) return;

//   const chatId = ctx.chat.id;
//   const userId = ctx.from.id;
//   const word = text.toLowerCase();

//   const game = gameManager.getGame(chatId);
//   if (!game || game.phase !== "playing") return;

//   const current = gameManager.currentPlayer(chatId);
//   if (current.id !== userId) return ctx.reply(`⛔ Not your turn! Current: ${current.name}`);

//   // Word validation
//   if (word.length < game.minLength) return ctx.reply(`❌ Word too short! Min: ${game.minLength}`);
//   if (game.lastWord && word[0] !== game.lastWord.slice(-1)) return ctx.reply(`❌ Word must start with '${game.lastWord.slice(-1)}'`);
//   if (game.usedWords.has(word)) return ctx.reply("❌ Word already used!");

//   const valid = await gameManager.validateWord(word);
//   if (!valid) return ctx.reply("❌ Not a valid word!");

//   // Accept word
//   gameManager.addWord(chatId, userId, word);
//   ctx.reply(`✅ Word accepted: ${word}`);

//   // Move to next turn
//   gameManager.nextTurn(chatId);
//   startTurnTimer(chatId, ctx);
// });

// // --- Start bot ---
// bot.start({ webhook: false });
// console.log("Word Chain Bot running...");



// require('dotenv').config();
const { Bot } = require("grammy");
const gameManager = require("./games");

const bot = new Bot(process.env.BOT_TOKEN);
const MIN_PLAYERS = 2;

// --- Helpers ---
function formatTurnOrder(players) {
    return players.map(p => p.name).join(" → ");
}

// --- Turn Timer ---
function startTurnTimer(chatId, ctx) {
    const game = gameManager.getGame(chatId);
    if (!game || game.players.length === 0) return;

    if (game.timer) clearTimeout(game.timer);

    const current = gameManager.currentPlayer(chatId);
    const lastLetter = game.lastWord ? game.lastWord.slice(-1).toUpperCase() : "-";
    const mention = `<a href="tg://user?id=${current.id}">${current.name}</a>`;

    const msg = `➡️ Round ${game.round}
🎯 Turn: ${mention}
⏱ Time: ${Math.floor(game.timeLimit / 1000)}s
🔤 Word must start with: '${lastLetter}', min length: ${game.minLength}`;

    // ctx.reply(msg, { parse_mode: "HTML" });
    ctx.reply(msg, { parse_mode: "HTML" }).then(sentMsg => {
        setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000); // delete after 15s
    });

    game.timer = setTimeout(() => {
        // ctx.reply(`${mention} ran out of time ❌`, { parse_mode: "HTML" });
        ctx.reply(`${mention} ran out of time ❌`, { parse_mode: "HTML" }).then(sentMsg => {
            setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000);
        });;

        gameManager.removePlayer(chatId, current.id);
        game.eliminated.add(current.id);

        if (game.players.length === 1) {
            // ctx.reply(`🏆 <a href="tg://user?id=${game.players[0].id}">${game.players[0].name}</a> wins!`, { parse_mode: "HTML" });
            ctx.reply(`🏆 <a href="tg://user?id=${game.players[0].id}">${game.players[0].name}</a> wins!`, { parse_mode: "HTML" }).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));;

            gameManager.endGame(chatId);
            return;
        } else if (game.players.length === 0) {
            ctx.reply(`No players left. Game over ❌`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
            gameManager.endGame(chatId);
            return;
        }

        gameManager.nextTurn(chatId);
        startTurnTimer(chatId, ctx);
    }, game.timeLimit);
}

// --- Commands ---
bot.command("startgame", (ctx) => {
    const chatId = ctx.chat.id;
    const starterId = ctx.from.id;
    const starterName = ctx.from.first_name;

    gameManager.startGame(chatId, starterId, starterName);
    ctx.reply(`${starterName} started a Word Chain game! 🎮 Join with /join`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
});

bot.command("join", (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;

    const game = gameManager.getGame(chatId);
    if (!game) return ctx.reply("No active game! Start one with /startgame");
    if (game.eliminated.has(userId)) return ctx.reply(`${userName}, you were eliminated ❌`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    const added = gameManager.addPlayer(chatId, userId, userName);
    if (!added) return ctx.reply(`${userName} is already in the game.`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    if (game.phase === "waiting") {
        ctx.reply(`${userName} joined! Players: ${formatTurnOrder(game.players)}`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

        if (game.players.length >= MIN_PLAYERS) {
            game.phase = "playing";
            gameManager.shufflePlayers(chatId);
            ctx.reply(`✅ Game starting!\nTurn order: ${formatTurnOrder(game.players)}`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
            startTurnTimer(chatId, ctx);
        }
    } else {
        ctx.reply(`${userName} joined mid-game! They’ll join next round.`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
    }
});

bot.command("flee", (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const game = gameManager.getGame(chatId);
    if (!game || game.phase !== "playing") return ctx.reply("No active game to flee from.").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    const player = game.players.find(p => p.id === userId);
    if (!player) return ctx.reply("You are not in the game.").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    gameManager.removePlayer(chatId, userId);
    ctx.reply(`${player.name} left the game ❌`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    if (game.players.length === 1) {
        ctx.reply(`🏆 <a href="tg://user?id=${game.players[0].id}">${game.players[0].name}</a> wins!`, { parse_mode: "HTML" }).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
        gameManager.endGame(chatId);
    } else if (game.players.length > 1) {
        startTurnTimer(chatId, ctx);
    }
});

bot.command("endgame", (ctx) => {
    const chatId = ctx.chat.id;
    const game = gameManager.getGame(chatId);
    if (!game) return ctx.reply("No active game!").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
    gameManager.endGame(chatId);
    ctx.reply("Game ended manually.").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
});

// --- Word handler ---
bot.on("message:text", async ctx => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;

    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const word = text.toLowerCase();

    const game = gameManager.getGame(chatId);
    if (!game || game.phase !== "playing") return;

    // Only players can play
    const player = game.players.find(p => p.id === userId);
    if (!player) return; // Ignore messages from non-players

    const current = gameManager.currentPlayer(chatId);
    if (current.id !== userId) {
        const mentionCurrent = `<a href="tg://user?id=${current.id}">${current.name}</a>`;
        return ctx.reply(`⛔ Not your turn! Current turn: ${mentionCurrent}`, { parse_mode: "HTML" }).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
    }

    if (word.length < game.minLength) return ctx.reply(`❌ Word too short! Min length: ${game.minLength}`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    // First word
    if (!game.lastWord) {
        const valid = await gameManager.validateWord(word);
        if (!valid) return ctx.reply("❌ Not a valid word!").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
        gameManager.addWord(chatId, userId, word);
    } else {
        if (word[0] !== game.lastWord.slice(-1).toLowerCase()) return ctx.reply(`❌ Word must start with '${game.lastWord.slice(-1).toUpperCase()}'`).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
        if (game.usedWords.has(word)) return ctx.reply("❌ Word already used!").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
        const valid = await gameManager.validateWord(word);
        if (!valid) return ctx.reply("❌ Not a valid word!").then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));
        gameManager.addWord(chatId, userId, word);
    }

    if (game.timer) clearTimeout(game.timer);
    gameManager.nextTurn(chatId);

    const next = gameManager.currentPlayer(chatId);
    const mentionNext = `<a href="tg://user?id=${next.id}">${next.name}</a>`;
    const lastLetter = game.lastWord.slice(-1).toUpperCase();

    ctx.reply(
        `✅ Word accepted: ${word}\n🔤 Next word must start with: '${lastLetter}'`,
        { parse_mode: "HTML" }
    ).then(sentMsg => setTimeout(() => ctx.deleteMessage(sentMsg.message_id).catch(() => {}), 15000));

    startTurnTimer(chatId, ctx);
});

// --- Start bot ---
bot.start({ webhook: false });
console.log("Word Chain Bot running...");
