import React from "react";
import Profileinfo from "../Cards/Profileinfo";

const Navbar = () => {
  return (
    <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow">
      <h2 className=" text-xl font-medium text-black py-2">Notes</h2>

      <Profileinfo />
    </div>
  );
};

export default Navbar;
