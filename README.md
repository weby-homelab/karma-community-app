# Karma Community App 🏆 (Docker Edition)

<p align="center">
  <img src="karma-community-app-dashboard-1.png" width="800" alt="Karma Community App Screenshot" />
</p>

Сучасний Telegram Mini App для гейміфікації спільноти. Ця версія оптимізована для роботи в **Docker**-середовищі, підтримує легке горизонтальне масштабування (multi-tenancy) та віддачу статичного React-застосунку прямо через вбудований Node.js сервер.

![Karma Community App Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Stack](https://img.shields.io/badge/Stack-Node.js%20|%20Docker%20|%20SQLite-blueviolet)

## 🏗️ Архітектура Системи (Docker)

```mermaid
graph TD
    %% Nodes definition
    User((👤 Користувач))
    TG[Telegram App]
    
    subgraph "Docker Host"
      Proxy[🌐 Reverse Proxy<br/><i>Cloudflared / Nginx / Traefik</i>]
      
      subgraph "karma-community-app (Container)"
        Node[🟢 Node.js 22<br/><i>Express + grammY + React SPA</i>]
      end
      
      DB[(🗄️ SQLite Data Volume<br/><i>./data/karma.db</i>)]
    end

    %% Connections
    User -->|Взаємодія / Реакції| TG
    TG <-->|Events / Commands / UI| Proxy
    Proxy <--> Node
    Node <-->|Read/Write| DB

    %% Styles
    classDef primary fill:#646cff,stroke:#fff,stroke-width:2px,color:#fff
    classDef secondary fill:#2c2c2c,stroke:#646cff,stroke-width:1px,color:#fff
    classDef highlight fill:#ff9a9e,stroke:#fff,stroke-width:2px,color:#000
    classDef storage fill:#a18cd1,stroke:#fff,stroke-width:1px,color:#fff

    class Node primary
    class Proxy highlight
    class DB storage
    class TG secondary
```

---

## 🌟 Можливості (Features)

*   **Тиха Гейміфікація:** Карма нараховується виключно за емодзі-реакції на повідомлення.
*   **Docker-First:** Один надлегкий образ на базі Alpine/Debian slim, який містить в собі як Telegram-бота, так і зібраний Frontend.
*   **Мульти-інстанс:** Легко запускайте 3, 5 або 10 копій ботів для різних спільнот на одному сервері через єдиний `docker-compose.yml`.
*   **Гарний Інтерфейс (Glassmorphism):** Сучасний, адаптивний дизайн.

## 🚀 Швидкий старт (Docker Compose)

Найпростіший спосіб розгорнути додаток:

1.  **Створіть робочу директорію:**
    ```bash
    mkdir karma-app && cd karma-app
    ```

2.  **Створіть `docker-compose.yml`:**
    ```yaml
    version: '3.8'
    services:
      karma-bot:
        image: webyhomelab/karma-community-app:latest
        container_name: karma-bot
        restart: unless-stopped
        ports:
          - "3015:3000"
        environment:
          - BOT_TOKEN=Ваш_Telegram_Бот_Токен
          - DB_PATH=/app/backend/data/karma.db
        volumes:
          - ./data:/app/backend/data
    ```

3.  **Запустіть:**
    ```bash
    docker compose up -d
    ```
Додаток буде доступний на порту 3015. Всі дані надійно зберігаються у папці `./data/`.

Для класичного запуску на "голому залізі" (bare-metal) без Docker, використовуйте гілку `classic`.

## ⚙️ Адмін-панель
Налаштування додатка зручно здійснюється через вбудовану адмін-панель за адресою `/admin`.

![Адмін-панель](karma-community-app-admin.png)

**Доступні налаштування:**
*   **Заголовок сайту:** (напр. *🏆 Рейтинг KRUHLYK Community*)
*   **Telegram Bot Token:** `123456789:ABCdefGHIjklmNOPqrsTUVwxyz`
*   **Chat ID (опціонально):** `-100123456789`
*   **WebApp URL (для кнопки Start):** `https://kruhlyk.srvrs.top/`
*   **Змінити пароль Адміна:** (залиште пустим, якщо не треба)
*   **Імпорт Даних:** Можливість завантажити бекап карми у JSON-форматі.

## 🤝 Контриб'ютори
Будь-які Pull Requests (PR) дуже вітаються! Створюйте Issue, якщо знаходите баги або хочете додати новий функціонал. 

## 📄 Ліцензія
[MIT License](LICENSE)

<br>
<p align="center">
  Built in Ukraine under air raid sirens &amp; blackouts ⚡<br>
  &copy; 2026 Weby Homelab
</p>
