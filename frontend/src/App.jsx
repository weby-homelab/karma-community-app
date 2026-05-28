import { useState, useEffect } from 'react'
import { version } from '../package.json'
import './index.css'

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({ site_title: '🏆 Рейтинг активності', bot_name: '' });

  useEffect(() => {
    // Expand Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const fetchWithRetry = async (url, retries = 5, delay = 2000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Bad response');
          return await res.json();
        } catch (err) {
          if (i === retries - 1) throw err;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        // Fetch Settings
        try {
          const settingsData = await fetchWithRetry(`${apiUrl}/api/settings`, 5, 2000);
          setSettings(settingsData);
          document.title = settingsData.site_title || '🏆 Рейтинг активності';
        } catch (e) {
          console.warn('Could not fetch settings, using defaults');
        }

        // Fetch Leaderboard
        const data = await fetchWithRetry(`${apiUrl}/api/leaderboard`, 5, 2000);
        setLeaderboard(data);

        // Fetch user profile if WebApp info is available
        const user = tg?.initDataUnsafe?.user;
        if (user && user.id) {
          const queryParams = new URLSearchParams({
            first_name: user.first_name || '',
            username: user.username || ''
          }).toString();
          
          try {
            const profileData = await fetchWithRetry(`${apiUrl}/api/user/${user.id}?${queryParams}`, 3, 1000);
            setMyProfile(profileData);
          } catch (e) {
            // User not found or server error
            setMyProfile({
              first_name: user.first_name,
              karma: 0,
              rank: '?'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Сервер тимчасово недоступний (можливо, перезапускається). Спробуйте оновити сторінку за хвилину.');
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
        <h1>{settings.site_title || '🏆 Рейтинг KRUHLYK Community'}</h1>
        <p>Рейтинг базується на реакціях, розділених за трьома головними категоріями: Флудер-Юмораст, Корисний Гуру та Скептик/Аналітик.<br/><small style={{opacity: 0.8}}><i>* Смужка біля імені відображає пропорцію сили кожної категорії.</i></small></p>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="loader">Завантаження рейтингу...</div>
        ) : error ? (
          <div className="loader" style={{ color: '#ff6b6b' }}>{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="onboarding-container">
            <h2>👋 Ласкаво просимо до KRUHLYK Karma!</h2>
            <p className="onboarding-intro">Ваша система оцінки активності чату ще не налаштована. Слідуйте цим простим крокам, щоб запустити її:</p>
            
            <div className="onboarding-steps">
              <div className="onboarding-step">
                <span className="step-num">1</span>
                <div className="step-content">
                  <h3>🤖 Додайте бота до чату</h3>
                  <p>Запросіть вашого Telegram-бота в групу як адміністратора, щоб він міг реєструвати реакції на повідомлення.</p>
                </div>
              </div>
              
              <div className="onboarding-step">
                <span className="step-num">2</span>
                <div className="step-content">
                  <h3>🔓 Вимкніть Group Privacy</h3>
                  <p>Через <strong>@BotFather</strong> вимкніть налаштування <i>Group Privacy</i> та переконайтеся, що ввімкнено <i>message_reaction</i> у дозволених оновленнях.</p>
                </div>
              </div>
              
              <div className="onboarding-step">
                <span className="step-num">3</span>
                <div className="step-content">
                  <h3>📥 Імпортуйте історію чату</h3>
                  <p>Експортуйте історію чату з Telegram Desktop у форматі <strong>JSON</strong> та завантажте її в адмін-панелі для миттєвого заповнення рейтингу.</p>
                </div>
              </div>
            </div>

            <div className="onboarding-actions">
              <a href="/admin" className="onboarding-btn">⚙️ Перейти до Адмінки</a>
            </div>
          </div>
        ) : (
          <>
            <div className="leaderboard-legend">
              <div className="legend-item">
                <span className="legend-dot flooder"></span>
                <span className="legend-label">🎭 Флудер (😁, 🤣, 🤪)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot guru"></span>
                <span className="legend-label">🛠 Гуру (🔥, 👍, 💯, 🤝, 🫡, ❤️, 👌, 😎)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot skeptic"></span>
                <span className="legend-label">🧐 Скептик (🤔, 👀, 🤷‍♂️, 🤯, 😱, 👎, 😢)</span>
              </div>
            </div>
            <div className="leaderboard">
              {leaderboard.map((user, index) => {
                const flooder = user.karma_flooder || 0;
                const guru = user.karma_guru || 0;
                const skeptic = user.karma_skeptic || 0;
                const total = user.karma || 0;
                const sum = flooder + guru + skeptic;
                const divisor = sum > 0 ? sum : 1;
                const flooderPct = sum > 0 ? (flooder / divisor) * 100 : 0;
                const guruPct = sum > 0 ? (guru / divisor) * 100 : 0;
                const skepticPct = sum > 0 ? (skeptic / divisor) * 100 : 0;

                return (
                  <div className="leaderboard-item" key={user.id}>
                    <div className={`rank ${getRankClass(index)}`}>
                      #{index + 1}
                    </div>
                    <div className="user-info">
                      <span className="username">{user.first_name || user.username || 'Анонім'}</span>
                      <div className="karma-bar-container">
                        {flooder > 0 && (
                          <div 
                            className="karma-bar-segment flooder" 
                            style={{ width: `${flooderPct}%` }}
                            title={`Флудер-Юмораст: ${flooder}`}
                          />
                        )}
                        {guru > 0 && (
                          <div 
                            className="karma-bar-segment guru" 
                            style={{ width: `${guruPct}%` }}
                            title={`Корисний Гуру / Технічний Авторитет: ${guru}`}
                          />
                        )}
                        {skeptic > 0 && (
                          <div 
                            className="karma-bar-segment skeptic" 
                            style={{ width: `${skepticPct}%` }}
                            title={`Скептик / Аналітик / Думер: ${skeptic}`}
                          />
                        )}
                        {total === 0 && (
                          <div 
                            className="karma-bar-segment empty" 
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}
                          />
                        )}
                      </div>
                      <div className="karma-bar-stats">
                        <span className="stat-item flooder">🎭 {flooder}</span>
                        <span className="stat-item guru">🛠 {guru}</span>
                        <span className="stat-item skeptic">🧐 {skeptic}</span>
                      </div>
                    </div>
                    <div className="karma-score">
                      {total} <span className="karma-icon">🔥</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <footer className="footer-credits">
        <p>
          <a href="https://github.com/weby-homelab/karma-community-app" target="_blank" rel="noopener noreferrer">
            Оновлено: 28.05.2026 17:57
          </a>
        </p>
        <p>&copy; 2026 Weby Homelab &bull; v{version}</p>
      </footer>

      {myProfile && (() => {
        const flooder = myProfile.karma_flooder || 0;
        const guru = myProfile.karma_guru || 0;
        const skeptic = myProfile.karma_skeptic || 0;
        const total = myProfile.karma || 0;
        const sum = flooder + guru + skeptic;
        const divisor = sum > 0 ? sum : 1;
        const flooderPct = sum > 0 ? (flooder / divisor) * 100 : 0;
        const guruPct = sum > 0 ? (guru / divisor) * 100 : 0;
        const skepticPct = sum > 0 ? (skeptic / divisor) * 100 : 0;

        return (
          <div className="glass-panel my-profile">
            <div className="user-info">
              <span className="username">Мій профіль ({myProfile.first_name})</span>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Позиція: #{myProfile.rank}</span>
              <div className="karma-bar-container">
                {flooder > 0 && (
                  <div 
                    className="karma-bar-segment flooder" 
                    style={{ width: `${flooderPct}%` }}
                  />
                )}
                {guru > 0 && (
                  <div 
                    className="karma-bar-segment guru" 
                    style={{ width: `${guruPct}%` }}
                  />
                )}
                {skeptic > 0 && (
                  <div 
                    className="karma-bar-segment skeptic" 
                    style={{ width: `${skepticPct}%` }}
                  />
                )}
                {total === 0 && (
                  <div 
                    className="karma-bar-segment empty" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}
                  />
                )}
              </div>
              <div className="karma-bar-stats">
                <span className="stat-item flooder">🎭 {flooder}</span>
                <span className="stat-item guru">🛠 {guru}</span>
                <span className="stat-item skeptic">🧐 {skeptic}</span>
              </div>
            </div>
            <div className="karma-score">
              {total} <span className="karma-icon">🔥</span>
            </div>
          </div>
        );
      })()}
    </>
  )
}

export default App