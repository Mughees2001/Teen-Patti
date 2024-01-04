import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import { PlayerInterface } from "../../store/playerSlice";

import "./playing-cards.css";
import "./teenpatti.css";

import CardsPlay from "./CardsPlay";
import { useSelector, useDispatch } from "react-redux";

interface MyCardsPageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}

const MyCards = ({ socket }: MyCardsPageProps) => {
  const playerState: any = useSelector((state: any) => state.player.player);
  let isFaceUpPlayable = false;
  let isFaceDownPlayable = false;
  if (playerState.faceUpCards.length > 0 && playerState.hand.length === 0) {
    isFaceUpPlayable = true;
  }
  if (
    playerState.faceDownCards.length > 0 &&
    playerState.hand.length === 0 &&
    playerState.faceUpCards.length === 0
  ) {
    isFaceDownPlayable = true;
  }
  const clickPilePick = () => {
    let replyServer = { playerState: playerState };
    socket.emit("pick-pile", replyServer);
  };
  //State containts an array of Names.
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
            <CardsPlay
              key={i * 2}
              rank={faceDownCards[i].rank}
              suit={faceDownCards[i].suit}
              socket={socket}
              isFaceDown={true}
              isPlayable={isFaceDownPlayable}
            />
          );
        }

        if (i < faceUpCards.length && faceUpCards.length > 0) {
          cardsList.push(
            <CardsPlay
              key={i * 2 + 1}
              rank={faceUpCards[i].rank}
              suit={faceUpCards[i].suit}
              socket={socket}
              isPlayable={isFaceUpPlayable}
              isFaceDown={false}
            />
          );
        }
      }
    } else if (faceUpCards.length === 0) {
      for (let i = 0; i < faceDownCards.length; i++) {
        cardsList.push(
          <CardsPlay
            key={i}
            rank={faceDownCards[i].rank}
            suit={faceDownCards[i].suit}
            socket={socket}
            isFaceDown={true}
            isPlayable={isFaceDownPlayable}
          />
        );
      }
    }
    return cardsList;
  }

  return (
    <div className="right-side-container my-cards-container">
      <h1>My Cards</h1>
      <br />
      <div>
        <button className="glow-on-hover" type="button" onClick={clickPilePick}>
          PICK PILE
        </button>
      </div>
      <div className="my-cards-inner-container">
        <ul className="hand remove-margin">
          {/* Handcards */}
          {playerState.hand.map((card: any, index: any) => (
            <CardsPlay
              key={index}
              rank={card.rank}
              suit={card.suit}
              socket={socket}
              isPlayable={true}
            />
          ))}
        </ul>
      </div>
      <div className="my-fixed-cards-container">
        <ul className="hand remove-margin">
          {makeCardsList(playerState.faceUpCards, playerState.faceDownCards)}
        </ul>
      </div>
    </div>
  );
};

export default MyCards;
