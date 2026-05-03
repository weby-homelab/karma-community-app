# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-05-03
### Added
- **Admin Panel**: Added protected `/admin` route with UI for uploading `result.json` backups.
- **Data Import**: Backend now securely processes `.json` files, wipes old data safely, and updates Karma leaderboard on the fly via multer endpoint.
- **PWA Support**: Added `manifest.json` allowing the community app to be installed natively on mobile devices.
- **SEO & Social Graph**: Added Open Graph metadata (`og:image`, `twitter:card`) and `og-image.png` for rich link previews in Telegram and Twitter.
