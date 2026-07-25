"use client";

import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-white text-gray-800 font-sans p-6 overflow-hidden relative">
      {/* Gentle, glowing ambient backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse duration-1000"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse duration-1000"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Elegant Frosted Glass Card */}
      <div className="max-w-xl w-full text-center space-y-8 p-12 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(225,29,72,0.1)] border border-white/80 relative z-10 transition-all duration-700 hover:shadow-[0_20px_50px_-12px_rgba(225,29,72,0.2)]">
        {/* Soft, Elegant Heading */}
        <h1 className="text-5xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-400 drop-shadow-sm pb-2">
          For Shatabdy
        </h1>

        <p className="text-lg text-gray-500 font-light tracking-wide">
          I made this just to remind you of something important.
        </p>

        {/* Romantic Interactive Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-8 px-10 py-4 bg-gradient-to-r from-rose-500 to-red-400 hover:from-rose-600 hover:to-red-500 text-white rounded-full font-medium text-lg shadow-xl shadow-rose-200 hover:shadow-rose-300 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
        >
          {isOpen ? "Close My Heart" : "Open My Heart"}
        </button>

        {/* Sincere Hidden Message */}
        <div
          className={`overflow-hidden transition-all duration-1000 ease-in-out ${
            isOpen
              ? "max-h-[500px] opacity-100 mt-10"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="p-8 bg-white/80 rounded-3xl border border-rose-50 shadow-inner">
            <p className="text-gray-700 text-xl leading-relaxed font-serif italic">
              "You are the most beautiful part of my everyday. Your smile lights
              up my world, and your kindness anchors my soul. I love you more
              than words—or screens—can ever express."
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
