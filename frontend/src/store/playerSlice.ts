import { createSlice } from "@reduxjs/toolkit";

// Access using dot notation
interface Card {
  rank: string;
  suit: string;
}

export interface PlayerInterface {
  id: any;
  name: string;
  hand: Card[];
  faceUpCards: Card[];
  faceDownCards: Card[];
  otherPlayersInfo: { name: string; faceUpCards: Card[] }[];
  centerCards: Card[];
  playerTurn: number;
  messages: string[];
}
export const PlayerData: PlayerInterface = {
  name: "",
  id: 0,
  hand: [],
  faceUpCards: [],
  faceDownCards: [],
  otherPlayersInfo: [],
  centerCards: [],
  playerTurn: 0,
  messages: [],
};

const initialState = {
  player: PlayerData,
};

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    initName: (state, action) => {
      state.player.name = action.payload.name;
    },
    initPlayerState: (state, action) => {
      state.player.name = action.payload.name;
      state.player.id = action.payload.id;
      state.player.hand = action.payload.hand;
      state.player.faceUpCards = action.payload.faceUpCards;
      state.player.faceDownCards = action.payload.faceDownCards;
      state.player.otherPlayersInfo = action.payload.otherPlayersInfo;
      state.player.centerCards = action.payload.centerCards;
      state.player.playerTurn = action.payload.playerTurn;
      state.player.messages = action.payload.messages;
    },
  },
});

//here increment and decrement (below) are functions.
export const { initName, initPlayerState } = playerSlice.actions;

export default playerSlice.reducer;

//messagec component
//game table component
//card division component (hand cards)
//table wala component
//

//msg slice
//card slice
//playerslice
