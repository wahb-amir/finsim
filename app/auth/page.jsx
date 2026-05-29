"use client";

import React, { useState } from "react";

const Auth = ({}) => {
  const [isLogin, setIsLogin] = useState(false);

  const handleLogin = () => {
    setIsLogin(!isLogin);
  };

  return (
    <>
      {/* Header */}
      <header className="mt-20 flex flex-col justify-center items-center text-center relative px-4">
        
        {/* Glow Effect */}
        <div className="absolute w-[320px] h-[120px] bg-[#F59E0B]/10 blur-3xl rounded-full"></div>

        {/* Badge */}
        <div
          className="
          relative
          bg-[rgba(245,158,11,0.06)]
          border border-[rgba(245,158,11,0.25)]
          px-6 py-2
          rounded-full
          shadow-[0_0_25px_rgba(245,158,11,0.15)]
          backdrop-blur-md
          mb-6
        "
        >
          <h1 className="text-[#F59E0B] font-semibold tracking-[3px] text-xs uppercase">
            {isLogin ? "Welcome Back" : "Start Your Journey"}
          </h1>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          {isLogin ? (
            <>
              Login To Your{" "}
              <span className="text-[#F59E0B] drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                Account
              </span>
            </>
          ) : (
            <>
              Create Your{" "}
              <span className="text-[#F59E0B] drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                Account
              </span>
            </>
          )}
        </h1>

        {/* Description */}
        <p className="mt-4 text-gray-400 max-w-[550px] text-sm leading-relaxed">
          {isLogin
            ? "Access your dashboard, continue your progress, and explore powerful features securely."
            : "Join our platform today and unlock a modern experience with powerful tools and seamless access."}
        </p>

        {/* Decorative Line */}
        <div className="mt-6 w-32 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
      </header>

      {/* Auth Form */}
      <section className="mt-12 px-4">
        <form className="flex flex-col justify-center items-center space-y-5">

          {/* Name Input */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Enter Your Name"
              className="
              w-full max-w-[420px]
              bg-transparent
              border border-[rgba(245,158,11,0.20)]
              focus:border-[#F59E0B]
              focus:ring-4
              focus:ring-[rgba(245,158,11,0.15)]
              outline-none
              transition-all duration-300
              px-5 py-3
              rounded-xl
              text-white
              placeholder:text-gray-500
              shadow-[0_0_20px_rgba(245,158,11,0.05)]
            "
            />
          )}

          {/* Email Input */}
          <input
            type="email"
            placeholder="Enter Your Email"
            className="
            w-full max-w-[420px]
            bg-transparent
            border border-[rgba(245,158,11,0.20)]
            focus:border-[#F59E0B]
            focus:ring-4
            focus:ring-[rgba(245,158,11,0.15)]
            outline-none
            transition-all duration-300
            px-5 py-3
            rounded-xl
            text-white
            placeholder:text-gray-500
            shadow-[0_0_20px_rgba(245,158,11,0.05)]
          "
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Enter Your Password"
            className="
            w-full max-w-[420px]
            bg-transparent
            border border-[rgba(245,158,11,0.20)]
            focus:border-[#F59E0B]
            focus:ring-4
            focus:ring-[rgba(245,158,11,0.15)]
            outline-none
            transition-all duration-300
            px-5 py-3
            rounded-xl
            text-white
            placeholder:text-gray-500
            shadow-[0_0_20px_rgba(245,158,11,0.05)]
          "
          />

          {/* Button */}
          <button
            className="
            mt-2
            w-full max-w-[420px]
            bg-[#F59E0B]
            hover:bg-[#ffb11f]
            text-black
            font-semibold
            py-3
            rounded-xl
            transition-all duration-300
            shadow-[0_0_25px_rgba(245,158,11,0.35)]
            hover:scale-[1.02]
            active:scale-[0.98]
          "
          >
            {isLogin ? "Login Account" : "Create Account"}
          </button>

          {/* Switch Auth */}
          <p
            onClick={handleLogin}
            className="
            text-gray-400
            hover:text-[#F59E0B]
            transition-all duration-300
            cursor-pointer
            text-sm
            mt-2
          "
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </p>
        </form>
      </section>
    </>
  );
};

export default Auth;