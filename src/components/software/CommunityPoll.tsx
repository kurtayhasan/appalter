"use client";

import React, { useState, useEffect } from "react";

interface CommunityPollProps {
  softwareA: string;
  softwareB: string;
  slugA: string;
  slugB: string;
}

export function CommunityPoll({ softwareA, softwareB, slugA, slugB }: CommunityPollProps) {
  const pollKey = `poll_${slugA}_vs_${slugB}`;
  const [votedChoice, setVotedChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ a: number; b: number }>({ a: 18, b: 12 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(pollKey);
      if (saved) {
        setVotedChoice(saved);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, [pollKey]);

  const handleVote = (choice: "a" | "b") => {
    if (votedChoice) return; // Already voted

    setVotedChoice(choice);
    setCounts((prev) => ({
      ...prev,
      [choice]: prev[choice] + 1,
    }));

    try {
      localStorage.setItem(pollKey, choice);
    } catch {
      // LocalStorage unavailable
    }
  };

  const total = counts.a + counts.b;
  const pctA = Math.round((counts.a / total) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="community-poll-card" aria-label="Community Poll">
      <h3 className="poll-title">
        Community Sentiment: Which one do you recommend?
      </h3>
      <div className="poll-buttons">
        <button
          type="button"
          className={`poll-btn ${votedChoice === "a" ? "voted" : ""}`}
          onClick={() => handleVote("a")}
        >
          <span>{softwareA}</span>
          <span className="poll-pct">{pctA}% ({counts.a} votes)</span>
        </button>

        <button
          type="button"
          className={`poll-btn ${votedChoice === "b" ? "voted" : ""}`}
          onClick={() => handleVote("b")}
        >
          <span>{softwareB}</span>
          <span className="poll-pct">{pctB}% ({counts.b} votes)</span>
        </button>
      </div>
      {votedChoice && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
          Thank you for sharing your feedback!
        </p>
      )}
    </div>
  );
}
