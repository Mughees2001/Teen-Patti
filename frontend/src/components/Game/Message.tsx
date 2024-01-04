import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import "./playing-cards.css";
import "./teenpatti.css";
import MessageBox from "./MessageBox";
import { useSelector, useDispatch } from "react-redux";
import { PlayerInterface } from "../../store/playerSlice";

interface MessagePageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}

const Message = ({ socket }: MessagePageProps) => {
  //State containts an array of Names.
  const playerState: any = useSelector((state: any) => state.player.player);

  return (
    <div className="right-side-container messages-container">
      <h1>Messages</h1>
      <div className="message-box">
        {playerState.messages.map((msg: any, index: any) => (
          <MessageBox key={index} message={msg} socket={socket} />
        ))}
      </div>
    </div>
  );
};

export default Message;
