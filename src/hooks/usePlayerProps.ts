import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mapSupabaseRow } from '../lib/playerProps';
import { PlayerProp } from '../types';

export function usePlayerProps(_sheetName: string = 'MasterRanking') {
  const [players, setPlayers] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProps = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel environment variables and redeploy.');
        return;
      }

      const { data, error: sbError } = await supabase
        .from('AppData')
        .select('*')
        .not('player_name', 'is', null)
        .neq('player_name', '')
        .order('confidence', { ascending: false })
        .limit(50);

      console.log('SUPABASE RESPONSE:', {
        rowCount: data?.length,
        firstRow: data?.[0],
        error: sbError,
        errorMessage: sbError?.message,
        errorCode: (sbError as any)?.code,
      });

      if (sbError) {
        console.error('Supabase error:', sbError);
        console.error('Error details:', JSON.stringify(sbError));
        setError(sbError.message);
        return;
      }

      console.log('Data received:', data?.length, 'rows');
      if ((data ?? []).length > 0) {
        console.log('First row:', JSON.stringify(data![0]));
      }

      setPlayers((data ?? []).map(mapSupabaseRow));
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[usePlayerProps] Unexpected error:', err.message);
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
