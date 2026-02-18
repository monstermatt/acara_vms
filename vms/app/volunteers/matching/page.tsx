"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Fetches volunteer data from the server.
 */
async function getData() {
  const res = await fetch("http://127.0.0.1:8000/api/volunteers/"); //*replace with the actual API endpoint */
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}



export default function MatchingPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Volunteer Matching</h1>
      <p className="text-gray-600">Coming soon</p>
    </div>
  );
}