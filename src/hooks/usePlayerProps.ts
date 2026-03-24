import { useState, useEffect } from "react";
import { PlayerProp } from "../types";

export function usePlayerProps(sheetName: string = "MasterRanking") {
  const [players, setPlayers] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/player-props?sheet=${encodeURIComponent(sheetName)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch data");
      }
      const data = await response.json();
      setPlayers(data.data);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
      setError(null);
    } catch (err: any) {
      console.error("Error fetching props:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProps();
  }, []);

  return { players, loading, error, lastUpdated, refresh: fetchProps };
}
