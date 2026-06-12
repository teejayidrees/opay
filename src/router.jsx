import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Sender from "./pages/Sender";
import Receiver from "./pages/Receiver";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/sender",
    element: <Sender />,
  },
  {
    path: "/receiver",
    element: <Receiver />,
  },
]);