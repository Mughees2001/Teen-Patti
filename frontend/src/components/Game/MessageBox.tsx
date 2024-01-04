import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";

import "./playing-cards.css";
import "./teenpatti.css";

interface MessageBoxPageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  message: string;
}

const MessageBox: React.FC<MessageBoxPageProps> = ({ message, socket }) => {
  // You can now use the 'socket' prop in your Card component logic

  return <div className="message-content-container">{`${message}`}</div>;
};

export default MessageBox;
