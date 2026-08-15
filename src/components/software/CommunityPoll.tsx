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
  const [counts, setCounts] = useState<{ a: number; b: number }>({ a: 0, b: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(pollKey);
      if (saved) {
        setVotedChoice(saved);
        setCounts(saved === "a" ? { a: 1, b: 0 } : { a: 0, b: 1 });
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
  const pctA = total > 0 ? Math.round((counts.a / total) * 100) : 0;
  const pctB = total > 0 ? 100 - pctA : 0;

  return (
    <div className="community-poll-card" aria-label="Community Poll">
      <h3 className="poll-title">
        Community Recommendation: Which one do you prefer?
      </h3>
      <div className="poll-buttons">
        <button
          type="button"
          className={`poll-btn ${votedChoice === "a" ? "voted" : ""}`}
          onClick={() => handleVote("a")}
        >
          <span>{softwareA}</span>
          {total > 0 && <span className="poll-pct">{pctA}%</span>}
        </button>

        <button
          type="button"
          className={`poll-btn ${votedChoice === "b" ? "voted" : ""}`}
          onClick={() => handleVote("b")}
        >
          <span>{softwareB}</span>
          {total > 0 && <span className="poll-pct">{pctB}%</span>}
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
