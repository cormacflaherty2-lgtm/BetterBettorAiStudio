import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mapSupabaseRow } from '../lib/playerProps';
import { PlayerProp } from '../types';

/**
 * Fetches player props from Supabase and maps them to the PlayerProp interface.
 * The _sheetName parameter is kept for API compatibility but is unused —
 * Supabase has a single player_props table.
 */
export function usePlayerProps(_sheetName: string = 'MasterRanking') {
  const [players, setPlayers] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProps = async () => {
    try {
      setLoading(true);

      const { data, error: sbError } = await supabase
        .from('AppData')
        .select('*')
        .not('player_name', 'is', null)
        .order('confidence', { ascending: false })
        .limit(50);

      if (sbError) {
        console.error('[usePlayerProps] Full Supabase error:', JSON.stringify(sbError));
        throw sbError;
      }

      console.log(`[usePlayerProps] Received ${(data ?? []).length} rows`);
      if ((data ?? []).length > 0) {
        console.log('[usePlayerProps] First row (raw):', JSON.stringify(data![0]));
      }

      const mapped = (data ?? []).map(mapSupabaseRow);

      setPlayers(mapped);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('[usePlayerProps] Supabase fetch failed:', err.message);
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
