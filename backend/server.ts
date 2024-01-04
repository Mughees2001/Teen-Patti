const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
app.use(cors());

const server = http.createServer(app);
const nameSocketMap = new Map<any, any>(); //(Name,Socket)
const CARD_VALUES = [
  "a",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "j",
  "q",
  "k",
];

function cardValues(cards: Card) {
  let ans: any = 0;
  if (cards.rank == "a") {
    ans = 14;
  } else if (cards.rank == "k") {
    ans = 13;
  } else if (cards.rank == "q") {
    ans = 12;
  } else if (cards.rank == "j") {
    ans = 11;
  } else {
    ans = parseInt(cards.rank);
  }
  return ans;
}

function messageFilter(messages: any) {
  let turns: string[] = messages.filter((message: any) =>
    message.endsWith("turn")
  );

  return turns;
}

function basicCondition(centerCard: Card, playerCard: Card) {
  if (centerCard) {
    //Implemented 7 is a low card (Done)
    if (centerCard.rank == "7") {
      if (
        playerCard.rank == "7" ||
        cardValues(centerCard) >= cardValues(playerCard)
      ) {
        return true;
      } else {
        return false;
      }
    }
    if (
      playerCard.rank == "7" ||
      cardValues(centerCard) <= cardValues(playerCard)
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}

const CARD_SUITS = ["diams", "clubs", "hearts", "spades"];

// Define the power cards and their effects

interface otherPlayerInfo {
  name: string;
  faceUpCards: Card[];
}
// Access using dot notation
interface Card {
  rank: string;
  suit: string;
}

//This will create a Deck that is Shuffled...
function createDeck() {
  let deck: Card[] = [];
  for (let i = 0; i < CARD_SUITS.length; i++) {
    for (let j = 0; j < CARD_VALUES.length; j++) {
      let card: Card = { rank: CARD_VALUES[j], suit: CARD_SUITS[i] };
      deck.push(card);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * i);
    let temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

function distributeCards(initialState: GameState, nameSocketMap: any) {
  let deck = createDeck(); //We have all the cards over here (52 cards)
  const numCardsPerPlayer = 3;
  let counter = 0;
  //Distributing the Cards to Each Player
  nameSocketMap.forEach((socket: any, player: any) => {
    let faceUpCards = deck.slice(0, numCardsPerPlayer);
    deck.splice(0, numCardsPerPlayer);
    let faceDownCards = deck.slice(0, numCardsPerPlayer);
    deck.splice(0, numCardsPerPlayer);
    let hand = deck.slice(0, numCardsPerPlayer);
    deck.splice(0, numCardsPerPlayer);
    let id = counter;
    counter++;
    let name = player;
    let otherPlayersInfo: any = [];
    let centerCards: any = [];
    const nameList = Array.from(nameSocketMap.keys()).map((key) => String(key));
    let messages = [nameList[initialState.currentPlayerIndex] + "'s turn"];
    initialState.players.push({
      id: id,
      name: name,
      hand: hand,
      faceUpCards: faceUpCards,
      faceDownCards: faceDownCards,
      otherPlayersInfo: otherPlayersInfo,
      centerCards: centerCards,
      playerTurn: 0,
      messages: messages,
    });
  });
  let centerCards: Card[] = [];
  centerCards.push(deck.slice(0, 1)[0]);
  deck.splice(0, 1);
  initialState.deck = deck;
  initialState.centerCards = centerCards;

  for (let i = 0; i < countPlayers(); i++) {
    let playerState = initialState.players[i];
    for (let j = 0; j < countPlayers(); j++) {
      let otherPlayerState = initialState.players[j];
      if (i != j) {
        let PlayerInfo = {
          name: otherPlayerState.name,
          faceUpCards: otherPlayerState.faceUpCards,
          faceDownCards: otherPlayerState.faceDownCards,
        };
        playerState.centerCards = initialState.centerCards;
        playerState.otherPlayersInfo.push(PlayerInfo);
      }
      initialState.players[i] = playerState;
    }
  }
  let i = 0;
  nameSocketMap.forEach((socketPlayer: any, name: any) => {
    socketPlayer.emit("init-state", initialState.players[i]);
    i++;
  });
}

// Define the state of the game
interface GameState {
  deck: Card[];
  centerCards: Card[];
  players: {
    id: any;
    name: string;
    hand: Card[];
    faceUpCards: Card[];
    faceDownCards: Card[];
    otherPlayersInfo: {
      name: string;
      faceUpCards: Card[];
      faceDownCards: any;
    }[];
    centerCards: Card[];
    playerTurn: number;
    messages: string[];
  }[];
  currentPlayerIndex: number;
  gameOver: boolean;
}
// Initialize the state of the game
let initialState: GameState = {
  deck: [],
  centerCards: [],
  players: [],
  currentPlayerIndex: 0,
  gameOver: false,
};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

server.listen(3001, () => {
  console.log("SERVER IS LISTENING ON PORT 3001");
});

function countPlayers() {
  return nameSocketMap.size;
}

function isDeckEmpty() {
  if (initialState.deck.length == 0) {
    return true;
  }
  return false;
}

//server side
io.on("connection", (socket: any) => {
  console.log("user connected with a socket id", socket.id);

  //1) Generate a clientID and send it to the client to store it.

  // const clientId = generateClientId();

  // 2)Player Press OK and submits the name to the server...Server will keep a check and see if the players need to stay in waiting area or not.

  socket.on("add-player-name", (name: any) => {
    if (countPlayers() < 4) {
      nameSocketMap.set(name, socket);
      console.log("Added Client now Size:", countPlayers());
      socket.emit("Load-Page", name);
    }

    if (countPlayers() == 4) {
      distributeCards(initialState, nameSocketMap);
      // Start Game Only When all State + Redux Initalized.
      nameSocketMap.forEach((socketPlayer: any, name: any) => {
        socketPlayer.emit("Start-Game");
      });
    }
  });
  socket.on("pick-pile", (playerData: any) => {
    let clickPlayerState = playerData.playerState; //The clickPlayer's State...
    const nameList = Array.from(nameSocketMap.keys()).map((key) => String(key));
    if (initialState.currentPlayerIndex == clickPlayerState.id) {
      if (!validityPlayer(initialState.currentPlayerIndex)) {
        let hand: Card[] = [];
        hand = initialState.players[
          initialState.currentPlayerIndex
        ].hand.concat(initialState.centerCards);
        initialState.centerCards = [];
        let messages = clickPlayerState.messages;
        //Next Player's Turn!!!
        initialState.currentPlayerIndex =
          (initialState.currentPlayerIndex + 1) % countPlayers();
        messages.push("Pile Picked!");
        messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
        clickPlayerState.centerCards = [];
        clickPlayerState.messages = messages;
        clickPlayerState.hand = hand;
        initialState.players[clickPlayerState.id] = clickPlayerState;
        updatePlayerInitialState(clickPlayerState.id);
        updateGameTable(nameSocketMap);
      } else {
        if (initialState.gameOver) {
          let updateMessage = clickPlayerState.messages;
          updateMessage.push("GAME is already over!");
          clickPlayerState.messages = updateMessage;
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        }
        else{
          let updateMessage = clickPlayerState.messages;
          updateMessage.push("[ERROR]You have a VALID OR POWER CARD to Play.");
          clickPlayerState.messages = updateMessage;
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        }
      }
    } else {
      if (initialState.gameOver) {
        let updateMessage = clickPlayerState.messages;
        updateMessage.push("GAME is already over!");
        clickPlayerState.messages = updateMessage;
        initialState.players[clickPlayerState.id] = clickPlayerState;
        updatePlayerInitialState(clickPlayerState.id);
        updateGameTable(nameSocketMap);
      }
      else{
        let updateMessage = clickPlayerState.messages;
        updateMessage.push("Please wait for your turn!");
        clickPlayerState.messages = updateMessage;
        initialState.players[clickPlayerState.id] = clickPlayerState;
        updatePlayerInitialState(clickPlayerState.id);
        updateGameTable(nameSocketMap);
      }
    }
  });

  socket.on("ClickedCard", (playerData: any) => {
    //Now apply the rules and send bac
    let cardPlayed: any = playerData.clickedCard; //The card that the person played
    let clickPlayerState = playerData.playerState; //The clickPlayer's State...
    const nameList = Array.from(nameSocketMap.keys()).map((key) => String(key));
    //Check if the player has a turn or not...

    if (
      initialState.currentPlayerIndex == clickPlayerState.id &&
      !initialState.gameOver
    ) {
      //1Basic Condition
      let centerCards = initialState.centerCards;
      let deck = initialState.deck;
      //POWER CARDS
      //10 burns the pile. The pile is set aside, and the next player can start with any card
      if (cardPlayed.rank == "10") {
        initialState.currentPlayerIndex =
          (initialState.currentPlayerIndex + 1) % countPlayers();

        if (cardPlayed.faceUp && clickPlayerState.hand.length === 0) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceUpCards,
            cardPlayed
          );
          let faceUpCards = clickPlayerState.faceUpCards;
          faceUpCards.splice(indexRemoveClickCard, 1);
          centerCards = [];
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 10] Pile Burnt");
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          clickPlayerState.faceUpCards = faceUpCards;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else if (
          cardPlayed.faceDown !== undefined &&
          cardPlayed.faceDown &&
          clickPlayerState.hand.length === 0 &&
          clickPlayerState.faceUpCards.length === 0
        ) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceDownCards,
            cardPlayed
          );
          let faceDownCards = clickPlayerState.faceDownCards;
          faceDownCards.splice(indexRemoveClickCard, 1);
          centerCards = [];
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 10] Pile Burnt");
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          clickPlayerState.faceDownCards = faceDownCards;
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.hand,
            cardPlayed
          );
          let hand = clickPlayerState.hand;
          hand.splice(indexRemoveClickCard, 1);
          if (!isDeckEmpty()) {
            hand.push(deck.slice(0, 1)[0]);
            deck.splice(0, 1);
          }
          centerCards = [];
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 10] Pile Burnt");
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          //Pile is Burnt!!!

          initialState.centerCards = centerCards;
          clickPlayerState.hand = hand;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        }
      }
      //8 is an invisible card. The game continues from the card that was below 8.
      else if (cardPlayed.rank == "8") {
        initialState.currentPlayerIndex =
          (initialState.currentPlayerIndex + 1) % countPlayers();
        if (cardPlayed.faceUp && clickPlayerState.hand.length === 0) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceUpCards,
            cardPlayed
          );
          let faceUpCards = clickPlayerState.faceUpCards;
          faceUpCards.splice(indexRemoveClickCard, 1);
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 8] Invisible Card Thrown");
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          clickPlayerState.faceUpCards = faceUpCards;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else if (
          cardPlayed.faceDown !== undefined &&
          cardPlayed.faceDown &&
          clickPlayerState.hand.length === 0 &&
          clickPlayerState.faceUpCards.length === 0
        ) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceDownCards,
            cardPlayed
          );
          let faceDownCards = clickPlayerState.faceDownCards;
          faceDownCards.splice(indexRemoveClickCard, 1);
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 8] Invisible Card Thrown");
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          clickPlayerState.faceDownCards = faceDownCards;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.hand,
            cardPlayed
          );
          let hand = clickPlayerState.hand;
          hand.splice(indexRemoveClickCard, 1);
          if (!isDeckEmpty()) {
            hand.push(deck.slice(0, 1)[0]);
            deck.splice(0, 1);
          }
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 8] Invisible Card Thrown");
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.hand = hand;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        }
      }
      //Re-freshing Card
      else if (cardPlayed.rank == "2") {
        if (cardPlayed.faceUp && clickPlayerState.hand.length === 0) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceUpCards,
            cardPlayed
          );
          let faceUpCards = clickPlayerState.faceUpCards;
          faceUpCards.splice(indexRemoveClickCard, 1);
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 2] Refreshing Card Thrown");
          centerCards.push(cardPlayed);
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          clickPlayerState.faceUpCards = faceUpCards;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else if (
          cardPlayed.faceDown !== undefined &&
          cardPlayed.faceDown &&
          clickPlayerState.hand.length === 0 &&
          clickPlayerState.faceUpCards.length === 0
        ) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceDownCards,
            cardPlayed
          );
          let faceDownCards = clickPlayerState.faceDownCards;
          faceDownCards.splice(indexRemoveClickCard, 1);
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 2] Refreshing Card Thrown");
          centerCards.push(cardPlayed);
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          clickPlayerState.faceDownCards = faceDownCards;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.hand,
            cardPlayed
          );
          let hand = clickPlayerState.hand;
          hand.splice(indexRemoveClickCard, 1);
          if (!isDeckEmpty()) {
            hand.push(deck.slice(0, 1)[0]);
            deck.splice(0, 1);
          }
          let messages = clickPlayerState.messages;
          messages.push("[POWER CARD 2] Refreshing Card Thrown");
          centerCards.push(cardPlayed);
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          clickPlayerState.hand = hand;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        }
      }
      //This is also has implemented 7 Low Card Power
      else if (
        basicCondition(centerCards[centerCards.length - 1], cardPlayed)
      ) {
        initialState.currentPlayerIndex =
          (initialState.currentPlayerIndex + 1) % countPlayers();
        centerCards.push(cardPlayed);
        if (cardPlayed.faceUp === true && clickPlayerState.hand.length === 0) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceUpCards,
            cardPlayed
          );
          let faceUpCards = clickPlayerState.faceUpCards;
          faceUpCards.splice(indexRemoveClickCard, 1);
          let messages = clickPlayerState.messages;
          if (cardPlayed.rank == "7") {
            messages.push("[POWER CARD 7]Low Card Thrown");
          }
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          //Hand + centerCards + PlayerTurn + Messages updated for the clickPlayer
          clickPlayerState.faceUpCards = faceUpCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else if (
          cardPlayed.faceDown &&
          clickPlayerState.hand.length === 0 &&
          clickPlayerState.faceUpCards.length === 0
        ) {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.faceDownCards,
            cardPlayed
          );
          let faceDownCards = clickPlayerState.faceDownCards;
          faceDownCards.splice(indexRemoveClickCard, 1);
          let messages = clickPlayerState.messages;
          if (cardPlayed.rank == "7") {
            messages.push("[POWER CARD 7]Low Card Thrown");
          }
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          //Hand + centerCards + PlayerTurn + Messages updated for the clickPlayer
          clickPlayerState.faceDownCards = faceDownCards;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        } else {
          let indexRemoveClickCard = findCardIndex(
            clickPlayerState.hand,
            cardPlayed
          );
          let hand = clickPlayerState.hand;
          hand.splice(indexRemoveClickCard, 1);
          if (!isDeckEmpty()) {
            hand.push(deck.slice(0, 1)[0]);
            deck.splice(0, 1);
          }
          //Now display the message of next player's turn
          let messages = clickPlayerState.messages;
          if (cardPlayed.rank == "7") {
            messages.push("[POWER CARD 7]Low Card Thrown");
          }
          messages.push(nameList[initialState.currentPlayerIndex] + "'s turn");
          initialState.deck = deck;
          initialState.centerCards = centerCards;
          //Hand + centerCards + PlayerTurn + Messages updated for the clickPlayer
          clickPlayerState.hand = hand;
          clickPlayerState.centerCards = centerCards;
          clickPlayerState.playerTurn = initialState.currentPlayerIndex;
          clickPlayerState.messages = messages;
          //Updates the initialState Completely for that Player!!!
          initialState.players[clickPlayerState.id] = clickPlayerState;
          updatePlayerInitialState(clickPlayerState.id);
          updateGameTable(nameSocketMap);
        }
      } else {
        let updateMessage = clickPlayerState.messages;
        updateMessage.push("Invalid Move!");
        clickPlayerState.messages = updateMessage;
        initialState.players[clickPlayerState.id] = clickPlayerState;
        updatePlayerInitialState(clickPlayerState.id);
        updateGameTable(nameSocketMap);
      }
    }
    //If not player's turn
    else {
      if (initialState.gameOver) {
        let updateMessage = clickPlayerState.messages;
        updateMessage.push("GAME is already over!");
        clickPlayerState.messages = updateMessage;
        initialState.players[clickPlayerState.id] = clickPlayerState;
        updatePlayerInitialState(clickPlayerState.id);
        updateGameTable(nameSocketMap);
      } else {
        let updateMessage = clickPlayerState.messages;
        updateMessage.push("Please wait for your turn!");
        clickPlayerState.messages = updateMessage;
        initialState.players[clickPlayerState.id] = clickPlayerState;
        updatePlayerInitialState(clickPlayerState.id);
        updateGameTable(nameSocketMap);
      }
    }

    //Check Winning Condition...
    if (
      clickPlayerState.hand.length === 0 &&
      clickPlayerState.faceUpCards.length === 0 &&
      clickPlayerState.faceDownCards.length === 0
    ) {
      let messages = clickPlayerState.messages.slice(
        0,
        clickPlayerState.messages.length - 2
      );
      messages.push("You Won!!!");
      clickPlayerState.messages = messages;
      initialState.players[clickPlayerState.id] = clickPlayerState;
      initialState.gameOver = true;
      updatePlayerInitialState(clickPlayerState.id);
      updateGameTable(nameSocketMap);
      nameSocketMap.forEach((socketPlayer: any, name: any) => {
        socketPlayer.emit("Game-Over", clickPlayerState.name);
      });
    }
  });

  function updateGameTable(nameSocketMap: any) {
    let i = 0;
    nameSocketMap.forEach((socketPlayer: any, name: any) => {
      socketPlayer.emit("update-state", initialState.players[i]);
      i++;
    });
  }
  // on refresh an socket.emit('disconnect') is called from Home.tsx which calls this function.
  // A new socket id is then emitted with io.on(socket)...

  socket.on("disconnect", () => {
    // Remove the client ID and socket ID pair from the map
    initialState.deck = [];
    initialState.centerCards = [];
    initialState.players = [];
    initialState.currentPlayerIndex = 0;
    console.log("Removing socket", socket.id);
    nameSocketMap.forEach((socketPlayer: any, name: any) => {
      if (socketPlayer == socket) {
        nameSocketMap.delete(name);
      }
    });
  });
});

function updatePlayerInitialState(clickPlayerID: any) {
  let indexOfClickPlayer = clickPlayerID;
  let stateClickPlayer: any = initialState.players[indexOfClickPlayer];
  for (let i = 0; i < countPlayers(); i++) {
    if (i != indexOfClickPlayer) {
      let playerState = initialState.players[i];
      playerState.centerCards = stateClickPlayer.centerCards;
      let latestTurnMessage: any = "";
      let messagesTemp: any = messageFilter(stateClickPlayer.messages);
      for (let i = messagesTemp.length - 1; i >= 0; i--) {
        if (messagesTemp[i].endsWith("turn")) {
          latestTurnMessage = messagesTemp[i];
          break;
        }
      }
      if (
        latestTurnMessage.slice(0, latestTurnMessage.length - 7) !=
        stateClickPlayer.name
      ) {
        playerState.messages.push(latestTurnMessage);
      }
      playerState.playerTurn = stateClickPlayer.playerTurn;
      //Updating the Inner stuff of other players... using click Player
      for (let i = 0; i < playerState.otherPlayersInfo.length; i++) {
        let otherPlayer = playerState.otherPlayersInfo[i];
        if (otherPlayer.name == stateClickPlayer.name) {
          otherPlayer.faceUpCards = stateClickPlayer.faceUpCards;
          otherPlayer.faceDownCards = stateClickPlayer.faceDownCards;
          playerState.otherPlayersInfo[i] = otherPlayer;
        }
      }
      initialState.players[i] = playerState;
    }
  }
}

function generateClientId() {
  // Generate a random 6-character string for the client ID
  return Math.random().toString(36).substring(2, 8);
}

function findCardIndex(hand: Card[], findCard: Card) {
  for (let i = 0; i < hand.length; i++) {
    if (hand[i].rank == findCard.rank && hand[i].suit == findCard.suit) {
      return i;
    }
  }
}

function validityPlayer(nextPlayerIndex: any) {
  let nextPlayerState: any = initialState.players[nextPlayerIndex];
  let centerTopCard: Card =
    initialState.centerCards[initialState.centerCards.length - 1];
  if (nextPlayerState.hand.length > 0) {
    for (let i = 0; i < nextPlayerState.hand.length; i++) {
      if (
        nextPlayerState.hand[i].rank == "2" ||
        nextPlayerState.hand[i].rank == "7" ||
        nextPlayerState.hand[i].rank == "8" ||
        nextPlayerState.hand[i].rank == "10"
      ) {
        return true;
      } else if (basicCondition(centerTopCard, nextPlayerState.hand[i])) {
        return true;
      }
    }
  } else if (
    nextPlayerState.faceUpCards.length > 0 &&
    nextPlayerState.hand.length == 0
  ) {
    for (let j = 0; j < nextPlayerState.faceUpCards.length; j++) {
      if (
        nextPlayerState.faceUpCards[j].rank == "2" ||
        nextPlayerState.faceUpCards[j].rank == "7" ||
        nextPlayerState.faceUpCards[j].rank == "8" ||
        nextPlayerState.faceUpCards[j].rank == "10"
      ) {
        return true;
      } else if (
        basicCondition(centerTopCard, nextPlayerState.faceUpCards[j])
      ) {
        return true;
      }
    }
  } else if (
    nextPlayerState.faceDownCards.length > 0 &&
    nextPlayerState.hand.length == 0 &&
    nextPlayerState.faceUpCards.length == 0
  ) {
    for (let j = 0; j < nextPlayerState.faceDownCards.length; j++) {
      if (
        nextPlayerState.faceDownCards[j].rank == "2" ||
        nextPlayerState.faceDownCards[j].rank == "7" ||
        nextPlayerState.faceDownCards[j].rank == "8" ||
        nextPlayerState.faceDownCards[j].rank == "10"
      ) {
        return true;
      } else if (
        basicCondition(centerTopCard, nextPlayerState.faceDownCards[j])
      ) {
        return true;
      }
    }
  }

  return false;
}
