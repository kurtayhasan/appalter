"use client";

import { useState } from "react";

interface VoteControlsProps {
  alternativeRecordId: string;
  softwareSlug: string;
  initialUpvotes: number;
  initialDownvotes?: number;
}

export function VoteControls({ alternativeRecordId, softwareSlug, initialUpvotes, initialDownvotes = 0 }: VoteControlsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0);
  const [downvotes, setDownvotes] = useState(initialDownvotes || 0);
  const [votedType, setVotedType] = useState<1 | -1 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mountedAt] = useState<number>(() => Date.now());

  const handleVote = async (type: 1 | -1) => {
    if (votedType !== null || isLoading) return;
    
    setIsLoading(true);
    
    // Optimistic update
    if (type === 1) setUpvotes(prev => prev + 1);
    else setDownvotes(prev => prev + 1);
    
    setVotedType(type);
    
    try {
      const res = await fetch("/api/votes/alternative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternative_record_id: alternativeRecordId,
          software_slug: softwareSlug,
          vote_type: type,
          _ts: mountedAt,
          _hp: "", // Honeypot trap: must remain strictly empty
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Revert on failure
        if (type === 1) setUpvotes(prev => prev - 1);
        else setDownvotes(prev => prev - 1);
        
        setVotedType(null);
        if (data.error === "Already voted") {
          setVotedType(type); // Don't let them try again
        }
      }
    } catch (e) {
      // Revert on network error
      if (type === 1) setUpvotes(prev => prev - 1);
      else setDownvotes(prev => prev - 1);
      
      setVotedType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const netScore = upvotes - downvotes;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.125rem' }}>
      <button 
        onClick={() => handleVote(1)}
        disabled={votedType !== null}
        className={`btn btn-sm ${votedType === 1 ? 'btn-primary' : 'btn-ghost'}`}
        aria-label="Upvote this alternative"
        title="Upvote"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem', minWidth: 'auto', height: 'auto' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={votedType === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
      
      <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>
        {netScore}
      </span>

      <button 
        onClick={() => handleVote(-1)}
        disabled={votedType !== null}
        className={`btn btn-sm ${votedType === -1 ? 'btn-primary' : 'btn-ghost'}`}
        aria-label="Downvote this alternative"
        title="Downvote"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem', minWidth: 'auto', height: 'auto' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={votedType === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </button>
    </div>
  );
}
