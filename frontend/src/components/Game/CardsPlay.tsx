import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import { PlayerInterface } from "../../store/playerSlice";
import { useSelector, useDispatch } from "react-redux";

import "./playing-cards.css";
import "./teenpatti.css";

interface CardsPlayPageProps {
  rank: string;
  suit: string;
  isFaceDown?: boolean;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  isPlayable?: boolean;
}

const CardsPlay: React.FC<CardsPlayPageProps> = ({
  rank,
  suit,
  isFaceDown,
  isPlayable,
  socket,
}) => {
  const suitSymbol: { [key: string]: string } = {
    hearts: "&hearts;",
    diams: "&diams;",
    clubs: "&clubs;",
    spades: "&spades;",
  };

  const playerState: any = useSelector((state: any) => state.player.player);
  let gameOver = false;
  socket.on("Game-Over", (winner: any) => {
    gameOver = true;
  });
  // You can now use the 'socket' prop in your Card component logic

  if (isFaceDown && !gameOver) {
    const clickHandle = () => {
      let clickedCard: any = {
        rank: rank,
        suit: suit,
        faceDown: isFaceDown,
        faceUp: !isFaceDown,
      };
      let replyServer = { clickedCard: clickedCard, playerState: playerState };
      socket.emit("ClickedCard", replyServer);
    };
    return (
      <li>
        <a className="card back" onClick={clickHandle}>
          *
        </a>
      </li>
    );
  }
  if (isPlayable && !gameOver) {
    const clickHandle = () => {
      let clickedCard: any = {
        rank: rank,
        suit: suit,
        faceDown: isFaceDown,
        faceUp: !isFaceDown,
      };
      let replyServer = { clickedCard: clickedCard, playerState: playerState };
      socket.emit("ClickedCard", replyServer);
    };
    return (
      <li>
        <a className={`card rank-${rank} ${suit}`} onClick={clickHandle}>
          <span className="rank">{rank.toUpperCase()}</span>
          <span
            className="suit"
            dangerouslySetInnerHTML={{ __html: suitSymbol[suit] }}
          />
        </a>
      </li>
    );
  }
  return (
    <li>
      <a className={`card rank-${rank} ${suit}`}>
        <span className="rank">{rank.toUpperCase()}</span>
        <span
          className="suit"
          dangerouslySetInnerHTML={{ __html: suitSymbol[suit] }}
        />
      </a>
    </li>
  );
};

export default CardsPlay;
