import { useState, useEffect } from 'react';

export default function TestAdmin() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/health');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Test Admin Panel</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <h2>API Health Status:</h2>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Quick Status:</h3>
            <p>Status: <strong>{data?.status || 'Unknown'}</strong></p>
            <p>MinIO: <strong>{data?.services?.minio?.status || 'Unknown'}</strong></p>
            <p>Browser-MCP: <strong>{data?.services?.browserMCP?.status || 'Unknown'}</strong></p>
            <p>Scraperr: <strong>{data?.services?.scraperr?.status || 'Unknown'}</strong></p>
            <p>DeepScrape: <strong>{data?.services?.deepScrape?.status || 'Unknown'}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}
