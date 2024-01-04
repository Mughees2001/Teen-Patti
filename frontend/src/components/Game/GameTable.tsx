import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import CardsTable from "./CardsTable";
import { useSelector, useDispatch } from "react-redux";
import { PlayerInterface } from "../../store/playerSlice";
import { initName, initPlayerState } from "../../store/playerSlice";

import "./playing-cards.css";
import "./teenpatti.css";

interface GameTablePageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}
// Access using dot notation

const GameTable = ({ socket }: GameTablePageProps) => {
  //State containts an array of Names.
  const playerState: any = useSelector((state: any) => state.player.player);

  //3 and 3
  function makeCardsList(faceUpCards: any, faceDownCards: any) {
    let cardsList: any = [];
    if (faceUpCards.length > 0) {
      for (
        let i = 0;
        i < Math.max(faceDownCards.length, faceUpCards.length);
        i++
      ) {
        if (i < faceDownCards.length) {
          cardsList.push(
            <CardsTable
              key={i * 2}
              rank={""}
              suit={""}
              socket={socket}
              isFaceDown={true}
            />
          );
        }

        if (i < faceUpCards.length) {
          cardsList.push(
            <CardsTable
              key={i * 2 + 1}
              rank={faceUpCards[i].rank}
              suit={faceUpCards[i].suit}
              socket={socket}
            />
          );
        }
      }
    } else if (faceUpCards.length === 0) {
      for (let i = 0; i < faceDownCards.length; i++) {
        cardsList.push(
          <CardsTable
            key={i}
            rank={""}
            suit={""}
            socket={socket}
            isFaceDown={true}
          />
        );
      }
    }

    return cardsList;
  }

  return (
    <div className="game-table-container">
      <div className="game-table">
        <div className="card-area">
          <ul className="hand remove-margin">
            {playerState.centerCards.map((card: any, index: any) => (
              <CardsTable
                key={index}
                rank={card.rank}
                suit={card.suit}
                socket={socket}
              />
            ))}
          </ul>
        </div>
        <div className="game-players-container">
          <div className="player-tag player-one">{`${playerState.name}`}</div>
          <ul className="hand remove-margin player-one-cards">
            {makeCardsList(playerState.faceUpCards, playerState.faceDownCards)}
          </ul>
        </div>

        <div className="game-players-container">
          <div className="player-tag player-two">{`${playerState.otherPlayersInfo[0].name}`}</div>
          <ul className="hand remove-margin player-two-cards">
            {makeCardsList(
              playerState.otherPlayersInfo[0].faceUpCards,
              playerState.otherPlayersInfo[0].faceDownCards
            )}
          </ul>
        </div>

        <div className="game-players-container">
          <div className="player-tag player-three">{`${playerState.otherPlayersInfo[1].name}`}</div>
          <ul className="hand remove-margin player-three-cards">
            {makeCardsList(
              playerState.otherPlayersInfo[1].faceUpCards,
              playerState.otherPlayersInfo[1].faceDownCards
            )}
          </ul>
        </div>

        <div className="game-players-container">
          <div className="player-tag player-four">{`${playerState.otherPlayersInfo[2].name}`}</div>
          <ul className="hand remove-margin player-four-cards">
            {makeCardsList(
              playerState.otherPlayersInfo[2].faceUpCards,
              playerState.otherPlayersInfo[2].faceDownCards
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameTable;
