import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerInterface } from "../../store/playerSlice";
import { useSelector, useDispatch } from "react-redux";
import { initName, initPlayerState } from "../../store/playerSlice";
import smily from "./smily.png";
import "./Loading.css";

interface LoadingPageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}
const Loader = ({ socket }: LoadingPageProps) => {
  const playerName: PlayerInterface[] = useSelector(
    (state: any) => state.player.player.name
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for the client-id event to get the client ID from the server

    socket.on("init-state", (playerState: any) => {
      dispatch(initPlayerState(playerState));
    });

    socket.on("Start-Game", (names: any) => {
      navigate("/game", { state: names });
    });
  });

  return (
    <div className="sampleLoadPage">
      <div>
        <h1 className="sampleTitle">{`Hi ${playerName}`}</h1>
      </div>
      <div className="loader"></div>
      <h2 className="sampleTitle">{`Loading...`}</h2>
    </div>
  );
};

export default Loader;
