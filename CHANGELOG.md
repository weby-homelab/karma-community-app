# Changelog

All notable changes to this project will be documented in this file.

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
