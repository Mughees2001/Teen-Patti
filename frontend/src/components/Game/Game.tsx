import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";

import "./playing-cards.css";
import "./teenpatti.css";
import Message from "./Message";
import GameTable from "./GameTable";
import MyCards from "./MyCards";
import { useSelector, useDispatch } from "react-redux";
import { PlayerInterface } from "../../store/playerSlice";
import { initName, initPlayerState } from "../../store/playerSlice";

interface GamePageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}

let winnerName = "";

const Game = ({ socket }: GamePageProps) => {
  const [winnerName, setWinnerName] = useState("");
  const [GameOver, setGameOver] = useState("");

  const dispatch = useDispatch();
  useEffect(() => {
    //UPDATE THE STATE SEND TO PLAYER FROM THE SERVER
    socket.on("update-state", (playerState: any) => {
      dispatch(initPlayerState(playerState));
    });
    socket.on("Game-Over", (winner: any) => {
      setWinnerName(`-->Winner:${winner}`);
    });
  });
  //State containts an array of Names.
  return (
    <div>
      <meta charSet="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Teen Patti</title>
      <div className="main-container playingCards">
        <div className="game-container">
          <div className="heading-container">
            <h1>Teen Patti</h1>
            <h1>{winnerName}</h1>
          </div>
          <GameTable socket={socket} />
        </div>
        <div className="messages-and-cards-container">
          <Message socket={socket} />
          <MyCards socket={socket} />
        </div>
      </div>
    </div>
  );
};

export default Game;
