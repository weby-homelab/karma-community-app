import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Expand Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        // Fetch Leaderboard
        const res = await fetch(`${apiUrl}/api/leaderboard`);
        const data = await res.json();
        setLeaderboard(data);

        // Fetch user profile if WebApp info is available
        const user = tg?.initDataUnsafe?.user;
        if (user && user.id) {
          const queryParams = new URLSearchParams({
            first_name: user.first_name || '',
            username: user.username || ''
          }).toString();
          
          const profileRes = await fetch(`${apiUrl}/api/user/${user.id}?${queryParams}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setMyProfile(profileData);
          } else {
            // User not found in DB yet
            setMyProfile({
              first_name: user.first_name,
              karma: 0,
              rank: '?'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  return (
    <>
      <div className="glass-panel header">
        <h1>🏆 Рейтинг Спільноти</h1>
        <p>Карма нараховується за реакції (🔥, ❤️) на ваші повідомлення.</p>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="loader">Завантаження рейтингу...</div>
        ) : leaderboard.length === 0 ? (
          <div className="loader">Рейтинг поки порожній. Залиште першу реакцію!</div>
        ) : (
          <div className="leaderboard">
            {leaderboard.map((user, index) => (
              <div className="leaderboard-item" key={user.id}>
                <div className={`rank ${getRankClass(index)}`}>
                  #{index + 1}
                </div>
                <div className="user-info">
                  <span className="username">{user.first_name || user.username || 'Анонім'}</span>
                </div>
                <div className="karma-score">
                  {user.karma} <span className="karma-icon">🔥</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {myProfile && (
        <div className="glass-panel my-profile">
          <div className="user-info">
            <span className="username">Мій профіль ({myProfile.first_name})</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Позиція: #{myProfile.rank}</span>
          </div>
          <div className="karma-score">
            {myProfile.karma} <span className="karma-icon">🔥</span>
          </div>
        </div>
      )}
    </>
  )
}

export default App