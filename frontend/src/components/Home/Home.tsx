import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { initName, initPlayerState } from "../../store/playerSlice";
import "./Home.css";
import Logo from "./Logo.jpeg";

//create an interface for the props that you want to pass to this component
interface HomePageProps {
  socket: Socket; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}

function HomePage({ socket }: HomePageProps) {
  //click handler

  const dispatch = useDispatch();
  const [inputName, setInputName] = useState("");

  const navigate = useNavigate();
  const handleChangeName = (e: any) => setInputName(e.target.value);
  const onSubmitNameClicked = (e: any) => {
    dispatch(initName({ name: inputName }));
    socket.emit("add-player-name", inputName);
  };

  useEffect(() => {
    // Listen for the client-id event to get the client ID from the server
    socket.on("Load-Page", (name: string) => {
      navigate("/load");
    });
    socket.on("init-state", (playerState: any) => {
      dispatch(initPlayerState(playerState));
    });
    socket.on("Start-Game", (name: string) => {
      navigate("/game");
    });
  }, [inputName]);

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      // 👇 Get input value
      onSubmitNameClicked(e);
    }
  };

  return (
    <>
      <div className="sampleHomePage">
        <h1 className="sampleTitle">Teen Patti</h1>
        <div className="logo-container">
          <img src={Logo} alt="logo" className="logo" />
        </div>
        <div className="sampleMessage">
          <input
            placeholder="Name"
            onChange={handleChangeName}
            onKeyDown={handleKeyDown}
            className="inputBox"
          ></input>
          <button onClick={onSubmitNameClicked} className="button123">
            {" "}
            OK{" "}
          </button>
        </div>
      </div>
    </>
  );
}
export default HomePage;
