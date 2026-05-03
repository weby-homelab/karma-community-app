import { useState } from 'react';
import './index.css'; // Re-use the existing styles

export default function Admin() {
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!password || !file) {
      setStatus('Будь ласка, введіть пароль та оберіть файл.');
      return;
    }

    setLoading(true);
    setStatus('Завантаження...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/upload-json`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStatus('✅ Рейтинг успішно оновлено!');
      } else {
        const errorText = await res.text();
        setStatus(`❌ Помилка: ${errorText}`);
      }
    } catch (err) {
      setStatus(`❌ Помилка з'єднання: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="glass-panel header">
        <h1>🔒 Адмін-панель</h1>
        <p>Оновлення рейтингу KRUHLYK Community.</p>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Файл JSON (result.json):</label>
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setFile(e.target.files[0])} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '12px', background: '#0088cc', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Обробка...' : 'Завантажити та Оновити'}
          </button>
        </form>
        
        {status && (
          <div style={{ marginTop: '20px', padding: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.1)' }}>
            {status}
          </div>
        )}
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a href="/" style={{ color: '#aaa', textDecoration: 'none' }}>← Повернутися на головну</a>
        </div>
      </div>
    </>
  );
}