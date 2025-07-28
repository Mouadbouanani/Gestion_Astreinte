import { Outlet } from "react-router-dom";
import Navbar from "../drafts/Navbar";

const App = () => {
  return (
    <div className="w-full p-6">
      <Navbar />
      <Outlet />
    </div>
  );
};
export default App;