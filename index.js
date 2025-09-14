const { Bot } = require("grammy");
const gameManager = require("./games");

const bot = new Bot(process.env.BOT_TOKEN);
const MIN_PLAYERS = 2;

// Helper to format turn order
function formatTurnOrder(players) {
    return players.map(p => p.name).join(" → ");
}

// Start a new game
bot.command("startgame", (ctx) => {
    const chatId = ctx.chat.id;
    const starterId = ctx.from.id;
    const starterName = ctx.from.first_name;

    gameManager.startGame(chatId, starterId, starterName);
    ctx.reply(`${starterName} started a Word Chain game! 🎮 Join using /join`);
});

// Join a game
bot.command("join", (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;

    const game = gameManager.getGame(chatId);
    if (!game) return ctx.reply("No active game! Start one with /startgame");

    const added = gameManager.addPlayer(chatId, userId, userName);
    if (!added) return ctx.reply(`${userName} is already in the game.`);

    ctx.reply(`${userName} joined the game!`);

    if (game.phase === "waiting" && game.players.length >= MIN_PLAYERS) {
        game.phase = "playing";
        gameManager.shufflePlayers(chatId);
        game.currentTurnIndex = 0;

        const turnOrder = formatTurnOrder(game.players);
        ctx.reply(`Game starting with players: ${turnOrder}`);
        const first = gameManager.currentPlayer(chatId);
        ctx.reply(`First turn: ${first.name} (You have ${game.turnTime / 1000}s). Word can be any length ≥ ${game.minWordLength}`);
        startTurnTimer(chatId, ctx);
    } else if (game.phase === "playing") {
        ctx.reply(`${userName} joined mid-game! They will play after current players.`);
    }
});

// Handle word submissions
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return; // ignore commands

    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const word = text.toLowerCase();

    const game = gameManager.getGame(chatId);
    if (!game || game.phase !== "playing") return;

    const player = game.players.find(p => p.id === userId);
    if (!player) return; 
    
    const current = gameManager.currentPlayer(chatId);
    if (current.id !== userId) return ctx.reply(`⛔ It's not your turn! Next: ${current.name}`);

    // Validate word length
    if (word.length < game.minWordLength) return ctx.reply(`❌ Word too short! Minimum length: ${game.minWordLength}`);

    // First word
    if (!game.lastWord) {
        const isValid = await gameManager.validateWord(word);
        if (!isValid) return ctx.reply("❌ Not a valid English word!");
        gameManager.addWord(chatId, userId, word);
        ctx.reply(`✅ ${word} accepted! Next must start with: '${word.slice(-1)}'`);
        if (game.timer) clearTimeout(game.timer);
        nextPlayerTurn(chatId, ctx);
        return;
    }

    // Subsequent turns
    if (word[0] !== game.lastWord.slice(-1)) return ctx.reply(`❌ Invalid! Word should start with: '${game.lastWord.slice(-1)}'`);
    if (game.usedWords.has(word)) return ctx.reply("❌ Word already used!");
    const isValid = await gameManager.validateWord(word);
    if (!isValid) return ctx.reply("❌ Not a valid English word!");

    gameManager.addWord(chatId, userId, word);
    ctx.reply(`✅ Accepted! Next must start with: '${word.slice(-1)}'`);
    if (game.timer) clearTimeout(game.timer);
    nextPlayerTurn(chatId, ctx);
});

// Player flee
bot.command("flee", (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const game = gameManager.getGame(chatId);
    if (!game || game.phase !== "playing") return ctx.reply("No active game to flee from.");

    const player = game.players.find(p => p.id === userId);
    if (!player) return ctx.reply("You are not in the game.");

    gameManager.removePlayer(chatId, userId);
    ctx.reply(`${player.name} has left the game.`);

    if (game.players.length === 1) {
        const winner = game.players[0];
        ctx.reply(`🏆 ${winner.name} is the winner!`);
        gameManager.endGame(chatId);
    } else {
        if (game.currentTurnIndex >= game.players.length) game.currentTurnIndex = 0;
        const current = gameManager.currentPlayer(chatId);
        ctx.reply(`Next turn: ${current.name}. Word must start with: '${game.lastWord.slice(-1)}'`);
        if (game.timer) clearTimeout(game.timer);
        startTurnTimer(chatId, ctx);
    }
});

// End game manually
bot.command("endgame", (ctx) => {
    const chatId = ctx.chat.id;
    const game = gameManager.getGame(chatId);
    if (!game) return ctx.reply("No active game!");
    gameManager.endGame(chatId);
    ctx.reply("Game ended manually.");
});

// Turn timer
function startTurnTimer(chatId, ctx) {
    const game = gameManager.getGame(chatId);
    if (!game) return;

    const current = gameManager.currentPlayer(chatId);
    const lastLetter = game.lastWord ? game.lastWord.slice(-1) : "-";
    ctx.reply(`⏱ ${current.name}, your turn! You have ${game.turnTime / 1000}s. Word must start with: '${lastLetter}'. Minimum length: ${game.minWordLength}`);

    game.timer = setTimeout(() => {
        ctx.reply(`${current.name} ran out of time and is eliminated! ❌`);
        gameManager.removePlayer(chatId, current.id);

        if (game.players.length === 1) {
            const winner = game.players[0];
            ctx.reply(`🏆 ${winner.name} is the winner!`);
            gameManager.endGame(chatId);
        } else {
            nextPlayerTurn(chatId, ctx);
        }
    }, game.turnTime);
}

// Move to next turn and handle rounds
function nextPlayerTurn(chatId, ctx) {
    const game = gameManager.getGame(chatId);
    if (!game) return;

    gameManager.nextTurn(chatId);

    // Check if round completed
    if (game.currentTurnIndex === 0) {
        game.roundsCompleted++;
        if (game.roundsCompleted % 2 === 0) adjustDifficulty(chatId, ctx);
    }

    startTurnTimer(chatId, ctx);
}

// Adjust difficulty
function adjustDifficulty(chatId, ctx) {
    const game = gameManager.getGame(chatId);
    if (!game) return;

    game.turnTime = Math.max(10000, game.turnTime - 5000);
    game.minWordLength = (game.minWordLength || 3) + 1;

    ctx.reply(`⚡ Difficulty increased! Turn time: ${game.turnTime / 1000}s. Minimum word length: ${game.minWordLength}`);
}

// Start the bot
bot.start({ webhook: false });
console.log("Word Chain Bot running...");
