import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export const SupabaseTest: React.FC = () => {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [profilesData, setProfilesData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStatus('Fetching users and profiles...');
        
        // Fetch users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(5);
        
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(5);

        if (usersError) {
          setError(usersError.message);
          setStatus('Error fetching users');
        } else if (profilesError) {
          setError(profilesError.message);
          setStatus('Error fetching profiles');
        } else {
          setUsersData(users || []);
          setProfilesData(profiles || []);
          setStatus(`Found ${users?.length || 0} users and ${profiles?.length || 0} profiles`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('Error occurred');
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🗄️ Database Test</h2>
      <p><strong>Status:</strong> {status}</p>
      {error && <div style={{ color: 'red' }}><strong>Error:</strong> {error}</div>}
      
      <h3>Users:</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(usersData, null, 2)}
      </pre>
      
      <h3>Profiles:</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(profilesData, null, 2)}
      </pre>
      
      <div style={{ marginTop: '20px' }}>
        <h3>🚀 Test Navigation:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/" style={{ padding: '8px 16px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Auth Page
          </a>
          <a href="/profile-setup" style={{ padding: '8px 16px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Profile Setup
          </a>
          <a href="/matching" style={{ padding: '8px 16px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Matching
          </a>
        </div>
      </div>
    </div>
  );
}; 