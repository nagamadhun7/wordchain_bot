




// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// class GameManager {
//     constructor() {
//         this.games = new Map(); // chatId => game state
//     }

//     startGame(chatId, starterId, starterName) {
//         this.games.set(chatId, {
//             phase: "waiting",
//             players: [{ id: starterId, name: starterName }],
//             currentTurnIndex: 0,
//             lastWord: "",
//             usedWords: new Set(),
//             scores: new Map([[starterId, 0]]),
//             timer: null,
//             roundsCompleted: 0,
//             turnTime: 30000,      // 30s initial
//             minWordLength: 3      // initial minimum word length
//         });
//     }

//     endGame(chatId) {
//         const game = this.games.get(chatId);
//         if (game && game.timer) clearTimeout(game.timer);
//         this.games.delete(chatId);
//     }

//     getGame(chatId) {
//         return this.games.get(chatId);
//     }

//     addPlayer(chatId, userId, name) {
//         const game = this.getGame(chatId);
//         if (!game.players.find(p => p.id === userId)) {
//             game.players.push({ id: userId, name });
//             game.scores.set(userId, 0);
//             return true;
//         }
//         return false;
//     }

//     shufflePlayers(chatId) {
//         const game = this.getGame(chatId);
//         for (let i = game.players.length - 1; i > 0; i--) {
//             const j = Math.floor(Math.random() * (i + 1));
//             [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
//         }
//     }

//     currentPlayer(chatId) {
//         const game = this.getGame(chatId);
//         return game.players[game.currentTurnIndex];
//     }

//     nextTurn(chatId) {
//         const game = this.getGame(chatId);
//         game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
//         return game.players[game.currentTurnIndex];
//     }

//     removePlayer(chatId, userId) {
//         const game = this.getGame(chatId);
//         const idx = game.players.findIndex(p => p.id === userId);
//         if (idx !== -1) {
//             game.players.splice(idx, 1);
//             if (game.currentTurnIndex >= idx) {
//                 game.currentTurnIndex = game.currentTurnIndex % game.players.length;
//             }
//         }
//     }

//     addWord(chatId, userId, word) {
//         const game = this.getGame(chatId);
//         game.lastWord = word;
//         game.usedWords.add(word);
//         const prevScore = game.scores.get(userId) || 0;
//         game.scores.set(userId, prevScore + 1);
//     }

//     async validateWord(word) {
//         try {
//             const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
//             if (!res.ok) return false;
//             const data = await res.json();
//             return !data.title;
//         } catch (e) {
//             console.error("Dictionary API error:", e);
//             return false;
//         }
//     }
// }

// module.exports = new GameManager();





//v2 working code
// const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// class GameManager {
//     constructor() {
//         this.games = new Map(); // chatId → game state
//     }

//     startGame(chatId, starterId, starterName) {
//         this.games.set(chatId, {
//             phase: "waiting",
//             players: [{ id: starterId, name: starterName }],
//             eliminated: new Set(),
//             currentTurnIndex: 0,
//             lastWord: "",
//             usedWords: new Set(),
//             scores: new Map([[starterId, 0]]),
//             timer: null,
//             round: 1,
//             timeLimit: 30 * 1000, // milliseconds
//             minLength: 3
//         });
//     }

//     endGame(chatId) {
//         const game = this.games.get(chatId);
//         if (game && game.timer) clearTimeout(game.timer);
//         this.games.delete(chatId);
//     }

//     getGame(chatId) {
//         return this.games.get(chatId);
//     }

//     addPlayer(chatId, userId, name) {
//         const game = this.getGame(chatId);
//         if (!game.players.find(p => p.id === userId)) {
//             game.players.push({ id: userId, name });
//             game.scores.set(userId, 0);
//             return true;
//         }
//         return false;
//     }

//     shufflePlayers(chatId) {
//         const game = this.getGame(chatId);
//         for (let i = game.players.length - 1; i > 0; i--) {
//             const j = Math.floor(Math.random() * (i + 1));
//             [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
//         }
//     }

//     currentPlayer(chatId) {
//         const game = this.getGame(chatId);
//         return game.players[game.currentTurnIndex];
//     }

//     nextTurn(chatId) {
//         const game = this.getGame(chatId);
//         game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
//         if (game.currentTurnIndex === 0) {
//             game.round++;
//             if (game.round % 2 === 0) {
//                 game.timeLimit = Math.max(5 * 1000, game.timeLimit - 5 * 1000);
//                 game.minLength++;
//             }
//         }
//         return game.players[game.currentTurnIndex];
//     }

//     removePlayer(chatId, userId) {
//         const game = this.getGame(chatId);
//         const idx = game.players.findIndex(p => p.id === userId);
//         if (idx !== -1) {
//             game.players.splice(idx, 1);
//             if (game.currentTurnIndex >= idx) {
//                 game.currentTurnIndex = game.currentTurnIndex % game.players.length;
//             }
//         }
//     }

//     addWord(chatId, userId, word) {
//         const game = this.getGame(chatId);
//         game.lastWord = word;
//         game.usedWords.add(word);
//         const prevScore = game.scores.get(userId) || 0;
//         game.scores.set(userId, prevScore + 1);
//     }

//     async validateWord(word) {
//         try {
//             const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
//             const data = await res.json();
//             return !data.title;
//         } catch {
//             return false;
//         }
//     }
// }

// module.exports = new GameManager();


const https = require("https");

class GameManager {
    constructor() {
        this.games = new Map(); // chatId → game state
    }

    startGame(chatId, starterId, starterName) {
        this.games.set(chatId, {
            phase: "waiting",
            players: [{ id: starterId, name: starterName }],
            eliminated: new Set(),
            currentTurnIndex: 0,
            lastWord: "",
            usedWords: new Set(),
            scores: new Map([[starterId, 0]]),
            timer: null,
            round: 1,
            timeLimit: 30 * 1000,
            minLength: 3
        });
    }

    endGame(chatId) {
        const game = this.games.get(chatId);
        if (game && game.timer) clearTimeout(game.timer);
        this.games.delete(chatId);
    }

    getGame(chatId) {
        return this.games.get(chatId);
    }

    addPlayer(chatId, userId, name) {
        const game = this.getGame(chatId);
        if (!game.players.find(p => p.id === userId)) {
            game.players.push({ id: userId, name });
            game.scores.set(userId, 0);
            return true;
        }
        return false;
    }

    shufflePlayers(chatId) {
        const game = this.getGame(chatId);
        for (let i = game.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
        }
    }

    currentPlayer(chatId) {
        const game = this.getGame(chatId);
        return game.players[game.currentTurnIndex];
    }

    nextTurn(chatId) {
        const game = this.getGame(chatId);
        game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
        if (game.currentTurnIndex === 0) {
            game.round++;
            if (game.round % 2 === 0) {
                game.timeLimit = Math.max(5 * 1000, game.timeLimit - 5 * 1000);
                game.minLength++;
            }
        }
        return game.players[game.currentTurnIndex];
    }

    removePlayer(chatId, userId) {
        const game = this.getGame(chatId);
        const idx = game.players.findIndex(p => p.id === userId);
        if (idx !== -1) {
            game.players.splice(idx, 1);
            if (game.currentTurnIndex >= idx) {
                game.currentTurnIndex = game.currentTurnIndex % game.players.length;
            }
        }
    }

    addWord(chatId, userId, word) {
        const game = this.getGame(chatId);
        game.lastWord = word;
        game.usedWords.add(word);
        const prevScore = game.scores.get(userId) || 0;
        game.scores.set(userId, prevScore + 1);
    }

    async validateWord(word) {
        // Accept capitalized words (proper nouns)
        if (word[0] === word[0].toUpperCase()) return true;

        return new Promise((resolve) => {
            const options = {
                method: "GET",
                hostname: "wordsapiv1.p.rapidapi.com",
                path: `/words/${encodeURIComponent(word)}`,
                headers: {
                    "x-rapidapi-key": process.env.WORDSAPI_KEY,
                    "x-rapidapi-host": "wordsapiv1.p.rapidapi.com"
                }
            };

            const req = https.request(options, res => {
                const chunks = [];
                res.on("data", chunk => chunks.push(chunk));
                res.on("end", () => {
                    try {
                        const data = JSON.parse(Buffer.concat(chunks).toString());
                        if (data.word) resolve(true);
                        else resolve(false);
                    } catch {
                        resolve(false);
                    }
                });
            });

            req.on("error", () => resolve(false));
            req.end();
        });
    }
}

module.exports = new GameManager();
