import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";

import "./playing-cards.css";
import "./teenpatti.css";

interface CardsTablePageProps {
  rank: string;
  suit: string;
  isFaceDown?: boolean;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
}

const CardsTable: React.FC<CardsTablePageProps> = ({
  rank,
  suit,
  isFaceDown,
  socket,
}) => {
  const suitSymbol: { [key: string]: string } = {
    hearts: "&hearts;",
    diams: "&diams;",
    clubs: "&clubs;",
    spades: "&spades;",
  };

  // You can now use the 'socket' prop in your Card component logic

  if (isFaceDown) {
    return (
      <li>
        <div className="card back">*</div>
      </li>
    );
  }

  return (
    <li>
      <div className={`card rank-${rank} ${suit}`}>
        <span className="rank">{rank.toUpperCase()}</span>
        <span
          className="suit"
          dangerouslySetInnerHTML={{ __html: suitSymbol[suit] }}
        />
      </div>
    </li>
  );
};

export default CardsTable;
