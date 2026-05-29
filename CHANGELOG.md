# Changelog

All notable changes to this project will be documented in this file.

## [0.7.7] - 2026-05-29
### Added
- **Почесне місце власника чату**: Додано можливість вказати Telegram ID власника чату/групи в налаштуваннях адмін-панелі. Власник відображається окремо на почесному місці зверху рейтингу з короною 👑 замість порядкового номера, і виключається зі звичайного списку учасників.

## [0.7.6] - 2026-05-29
### Fixed
- **Динамічна дата оновлення рейтингу**: Виправлено проблему, через яку при ручному імпорті JSON-файлу у футері не оновлювалась дата та час оновлення таблиці рейтингу. Тепер дата оновлюється автоматично у часовому поясі Києва (`Europe/Kyiv`) і відображається динамічно на клієнті.

## [0.7.5] - 2026-05-28
### Added
- **Класифікація реакцій за лінзами**: Поділ реакцій на Флудерів (меми), Гуру (база/експертиза) та Скептиків (думерство/ризики).
- **Лінійні діаграми (Stacked Bar Charts)**: Візуальне відображення часток категорій у кожного учасника з абсолютними числовими показниками.
- **Легенда рейтингу**: Детальний опис розподілу емодзі-реакцій на початку списку.
- **Екран онбордингу**: Зручні покрокові інструкції з налаштування бота та імпорту історії чату при порожній базі даних.
- **Оновлений скріншот**: Замінено головний скріншот проєкту для відображення нових stacked charts та легенди.

## [0.7.4] - 2026-05-22
### Added
- **Premium Dark Redesign**: OLED-friendly dark background (`#0c0d12`), Inter font, subtle mesh gradients, and layered glassmorphism.
- **Leaderboard Animations**: Staggered `fadeInUp` entrance animations for leaderboard items to improve perceived speed.
- **UI Visual Polish**: Medal-styled rank badges, bottom bar with blur and safe-area inset, shimmer loader animation, and focus glow rings on admin input fields.
### Fixed
- **Glass Panel Styling**: Replaced semi-transparent glass background with solid OLED-black to fix contrast issues.
- **Security Hardening**: Ignored Telegram history export (`result-*.json`) files in `.gitignore` and purged them from repository history to prevent accidental data leaks.

## [0.7.3] - 2026-05-11
### Added
- **Multi-Emoji Support**: Added support for 7 emoji reactions (🔥, ❤️, 👍, 👏, 🏆, 💯, ⚡️) when parsing Telegram chat history JSON.
- **Visual Clarification**: Updated the dashboard to clarify that the 🔥 icon represents the sum of all supported emoji reactions.
### Fixed
- **Parsing**: Fixed emoji variation selector matching in the JSON importer to ensure all Telegram-exported emojis are counted correctly.

## [0.7.2] - 2026-05-09
### Added
- **Secure First-Run Setup**: New installations now prompt the user to create an admin password on their first visit to the `/admin` panel.
### Fixed
- **Security**: Removed the hardcoded default admin password, significantly improving out-of-the-box security for self-hosted instances.

## [0.7.1] - 2026-05-09
### Fixed
- **Security Vulnerability**: Fixed a critical XSS vulnerability in the `ip-address` library by upgrading to version 10.1.1.
- **Dependencies**: Updated `express-rate-limit` and other backend dependencies to ensure a secure and stable environment. Confirmed 0 vulnerabilities via `npm audit`.

## [0.7.0] - 2026-05-09
### Added
- **Docker Edition**: Complete transition to a containerized architecture. The project now includes a optimized Dockerfile and a multi-tenant `docker-compose.yml` for easy scaling.
- **Improved Deployment**: Simplified setup for multiple community instances on a single host.
- **Documentation**: Updated README with architectural diagrams, Docker-first instructions, and new screenshots.

## [0.6.1] - 2026-05-03
### Fixed
- **Frontend Empty State Bug**: Added a robust retry mechanism to the frontend. It now gracefully waits and reconnects if the backend is temporarily unavailable (e.g., during the automatic restart triggered by saving settings in the Admin panel), preventing the leaderboard from falsely showing as empty.

## [0.6.0] - 2026-05-03
### Added
- **Zero Karma Tracking**: Users with 0 karma now appear on the leaderboard after a JSON data import.
- **Chronological Sorting**: The leaderboard and API now strictly respect the time a user was added to the chat (using message timestamps or exact addition time). Users with equal karma are sorted correctly by seniority in the community.
- **Database Schema Upgrade**: Automatically adds `join_date` to existing SQLite databases without losing data.

## [0.5.0] - 2026-05-03
### Added
- **Dynamic Settings via Admin Panel**: You can now configure Site Title, Telegram Bot Token, WebApp URL, and Chat ID dynamically via the `/admin` interface without touching `.env` or code.
- **Easy Onboarding**: Database now auto-generates a `settings` table to store configurations securely via SQLite.
- **Target Chat Restrictions**: The bot can now optionally be restricted to a specific Telegram Chat ID.

## [0.4.0] - 2026-05-03
### Added
- **Admin Panel**: Added protected `/admin` route with UI for uploading `result.json` backups.
- **Data Import**: Backend now securely processes `.json` files, wipes old data safely, and updates Karma leaderboard on the fly via multer endpoint.
- **PWA Support**: Added `manifest.json` allowing the community app to be installed natively on mobile devices.
- **SEO & Social Graph**: Added Open Graph metadata (`og:image`, `twitter:card`) and `og-image.png` for rich link previews in Telegram and Twitter.
