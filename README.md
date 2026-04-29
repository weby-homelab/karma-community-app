# Karma Community App 🏆

Сучасний Telegram Mini App для гейміфікації спільноти. Створено з використанням найновіших трендів 2026 року — нарахування "карми" через емодзі-реакції (🔥, ❤️, 👍 та інші) з відображенням таблиці лідерів у стильному інтерфейсі.

![Karma Community App Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Stack](https://img.shields.io/badge/Stack-Node.js%20|%20React%20|%20Vite-blueviolet)

---

## 🌟 Можливості (Features)

*   **Тиха Гейміфікація:** Карма нараховується виключно за емодзі-реакції на повідомлення. Ніякого текстового спаму типу "+1 до карми" у чатах!
*   **Гарний Інтерфейс (Glassmorphism):** Сучасний, адаптивний дизайн, розроблений за концепцією Glassmorphism (v3.4.1), ідеально виглядає у світлій та темній темах Telegram.
*   **Інтеграція з Telegram Web App:** Нативний досвід користувача прямо всередині месенджера. Запуск через кнопку `Menu Button`.
*   **Real-time оновлення бази:** SQLite база миттєво фіксує всі змінені та видалені реакції. Бот рахує дельту та забезпечує справедливу карму.
*   **Безпека та CORS:** Бекенд приховано за проксі від Vite (Node.js/Express) для безперебійної роботи через один публічний домен (`winner.srvrs.top`).

## 🛠️ Стек Технологій

**Frontend:**
*   React 18 + Vite (швидка збірка, HMR)
*   Vanilla CSS (Стилізація Glassmorphism)
*   Telegram Web App API

**Backend:**
*   Node.js (Express.js)
*   grammY (Сучасний та швидкий фреймворк для Telegram-ботів)
*   SQLite3 (Легка та надійна база даних)

## 🚀 Встановлення та Запуск

1.  **Клонування репозиторію:**
    ```bash
    git clone https://github.com/weby-homelab/karma-community-app.git
    cd karma-community-app
    ```

2.  **Налаштування бекенду:**
    ```bash
    cd backend
    npm install
    # Створіть файл .env:
    echo "BOT_TOKEN=Ваш_Telegram_Бот_Токен" > .env
    echo "PORT=3015" >> .env
    # Запустіть бекенд:
    node server.js
    ```

3.  **Налаштування фронтенду:**
    ```bash
    cd ../frontend
    npm install
    # Для розробки:
    npm run dev -- --host
    # Для продакшену:
    npm run build
    ```

4.  **Підключення бота в Telegram:**
    *   Додайте свого бота (наприклад, `@Monitor_DRivers_bot`) як адміністратора до вашої супергрупи.
    *   Налаштуйте `Menu Button` через `@BotFather`, щоб він відкривав вашу веб-адресу з фронтендом.

## 🤝 Контриб'ютори
Будь-які Pull Requests (PR) дуже вітаються! Створюйте Issue, якщо знаходите баги або хочете додати новий функціонал. 

## 📄 Ліцензія
[MIT License](LICENSE) © 2026 Weby Homelab.