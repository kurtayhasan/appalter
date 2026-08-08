"use client";

import { useState } from "react";

interface UpvoteButtonProps {
  alternativeRecordId: string;
  softwareSlug: string;
  initialUpvotes: number;
}

export function UpvoteButton({ alternativeRecordId, softwareSlug, initialUpvotes }: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpvote = async () => {
    if (hasVoted || isLoading) return;
    
    setIsLoading(true);
    setUpvotes(prev => prev + 1); // Optimistic update
    setHasVoted(true);
    
    try {
      const res = await fetch("/api/votes/alternative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternative_record_id: alternativeRecordId,
          software_slug: softwareSlug,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Revert on failure
        setUpvotes(prev => prev - 1);
        setHasVoted(false);
        if (data.error === "Already voted") {
          setHasVoted(true); // Don't let them try again
        }
      }
    } catch (e) {
      // Revert on network error
      setUpvotes(prev => prev - 1);
      setHasVoted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleUpvote}
      disabled={hasVoted}
      className={`btn btn-sm ${hasVoted ? 'btn-primary' : 'btn-ghost'} alt-upvote-btn`}
      aria-label="Upvote this alternative"
      title="Upvote"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
      <span>{upvotes}</span>
    </button>
  );
}
