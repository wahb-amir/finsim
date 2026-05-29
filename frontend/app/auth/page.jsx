"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const Auth = () => {
  const router = useRouter();
  const { user, loading, setUser } = useAuth();

  const [isLogin, setIsLogin] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  const showToast = (type, message) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    if (!loading && user) {
      router.push("/setup");
    }
  }, [loading, user, router]);

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setForm({
      name: "",
      email: "",
      password: "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/signin";

    const payload = isLogin
      ? { email: form.email, password: form.password }
      : form;

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", data.message || "Success");

        if (data.user) {
          setUser(data.user);
        }

        setTimeout(() => router.push("/setup"), 1200);
      } else {
        showToast("error", data.message || "Failed");
      }
    } catch (err) {
      showToast("error", "Server Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-[0_0_25px_rgba(0,0,0,0.4)] transition-all duration-300 backdrop-blur-md ${
            toast.type === "success"
              ? "bg-[#0f172a]/90 text-green-400 border border-green-500/30"
              : "bg-[#0f172a]/90 text-red-400 border border-red-500/30"
          }`}
        >
          {toast.message}
        </div>
      )}

      <header className="mt-20 flex flex-col justify-center items-center text-center relative px-4">
        <div className="absolute w-[320px] h-[120px] bg-[#F59E0B]/10 blur-3xl rounded-full"></div>

        <div className="relative bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.25)] px-6 py-2 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-md mb-6">
          <h1 className="text-[#F59E0B] font-semibold tracking-[3px] text-xs uppercase">
            {isLogin ? "Welcome Back" : "Start Your Journey"}
          </h1>
        </div>

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

        <p className="mt-4 text-gray-400 max-w-[550px] text-sm leading-relaxed">
          {isLogin
            ? "Access your dashboard, continue your progress, and explore powerful features securely."
            : "Join our platform today and unlock a modern experience with powerful tools and seamless access."}
        </p>

        <div className="mt-6 w-32 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
      </header>

      <section className="mt-12 px-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center space-y-5"
        >
          {!isLogin && (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder="Enter Your Name"
              className="w-full max-w-[420px] bg-transparent border border-[rgba(245,158,11,0.20)] focus:border-[#F59E0B] focus:ring-4 focus:ring-[rgba(245,158,11,0.15)] outline-none transition-all duration-300 px-5 py-3 rounded-xl text-white placeholder:text-gray-500 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
            />
          )}

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            placeholder="Enter Your Email"
            className="w-full max-w-[420px] bg-transparent border border-[rgba(245,158,11,0.20)] focus:border-[#F59E0B] focus:ring-4 focus:ring-[rgba(245,158,11,0.15)] outline-none transition-all duration-300 px-5 py-3 rounded-xl text-white placeholder:text-gray-500 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
          />

          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
            placeholder="Enter Your Password"
            className="w-full max-w-[420px] bg-transparent border border-[rgba(245,158,11,0.20)] focus:border-[#F59E0B] focus:ring-4 focus:ring-[rgba(245,158,11,0.15)] outline-none transition-all duration-300 px-5 py-3 rounded-xl text-white placeholder:text-gray-500 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
          />

          <button
            disabled={submitting}
            className="mt-2 w-full max-w-[420px] bg-[#F59E0B] hover:bg-[#ffb11f] text-black font-semibold py-3 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Please wait..."
              : isLogin
                ? "Login Account"
                : "Create Account"}
          </button>

          <p
            onClick={toggleMode}
            className="text-gray-400 hover:text-[#F59E0B] transition-all duration-300 cursor-pointer text-sm mt-2"
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
