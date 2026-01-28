import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import loginpage_img from "../../assets/loginpage_img.jpg";

// Custom hook to get window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize(); // initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

const AuthLayout = ({ children }) => {
  const { width } = useWindowSize();
  const navigate = useNavigate();
  const isMobile = width < 768; // Tailwind md breakpoint

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full relative">
      {/* Left Section */}
      <div className="relative hidden md:flex md:w-1/2 overflow-hidden">
        {/* Fixed Back Arrow Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 z-50 flex items-center justify-center 
                     text-white bg-black/60 rounded-full p-2 transition-all duration-200 
                     hover:bg-white hover:text-black hover:scale-105"
          title="Go back"
        >
          <IoArrowBack size={22} />
        </button>

        <img
          src={loginpage_img}
          alt="Login Page"
          className="w-full h-full object-cover"
        />

        {/* Animated text */}
        <div className="absolute inset-0 flex justify-center items-end pb-20">
          <h1 className="text-white text-2xl md:text-4xl font-bold whitespace-nowrap">
            {"Nothing is impossible".split("").map((char, index) => (
              <span
                key={index}
                className="inline-block animate-rise"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div
        className={`flex flex-1 items-center justify-center p-6 ${
          !isMobile ? "bg-black" : ""
        }`}
        style={
          isMobile
            ? {
                backgroundImage: `url(${loginpage_img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        <div className="w-full max-w-sm bg-gray-300 backdrop-blur-lg shadow-2xl rounded-3xl p-8 relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
