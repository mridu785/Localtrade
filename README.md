# Axom Bazar — Local Classifieds Marketplace PWA

A premium, mobile-first classifieds marketplace for Assam, built with vanilla HTML, CSS and ES modules. It shares one Firebase backend with future Android (Kotlin/Compose) and Admin Dashboard clients.

## What is included
- Google Authentication with persistent sessions.
- Firestore listings, categories, locations, favourites, chats, notifications, reports and configuration.
- Multi-step sell flow with drafts, image compression and secure image uploads.
- Search, filters, sorting, recommendations and pagination.
- Real-time chat with unread counts and notifications.
- PWA manifest, service worker and offline fallback.
- Firestore Security Rules and composite indexes.
- Cloudflare Worker proxy for ImgBB uploads with ID-token and App Check verification, ownership checks, magic-byte validation, quotas and rate limiting.
- Seed script for categories, Assam districts and app config.

## Quick start
1. Copy the project to a folder and serve it over HTTP:
   ```bash
   npx serve . -l 5173