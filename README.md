# Dayline — Bronx Weather & Markets (GitHub Pages edition)

This is a mobile-friendly Progressive Web App (PWA), not an iOS IPA.

## Included
- Live Bronx-area weather forecast from Open-Meteo.
- Current National Weather Service alerts from the official NWS API.
- Hourly and 7-day forecast, Fahrenheit/Celsius switch, and responsive layout.
- Stock gainers/losers interface with a clearly marked saved ZenBot snapshot.
- Google Finance shortcut and Material Symbols Rounded icons.
- iPhone Add to Home Screen support.

## Publish on GitHub Pages
1. Open your `dayline-bronx` GitHub repository.
2. Choose **Add file → Upload files**.
3. Open this folder on your computer, select everything inside it (including the `assets` folder and `.nojekyll`), and drag those items into GitHub's upload area. Do not upload a parent folder that hides `index.html` one level down.
4. Scroll down and choose **Commit changes**.
5. In the repository, open **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**. Choose branch **main**, folder **/(root)**, then **Save**.
7. Wait for the Pages deployment to finish, then open the site URL shown on the Pages settings screen.

GitHub Pages project sites are public. Do not upload secrets or private information.

## Data limitations
The connected ChatGPT AccuWeather and ZenBot integrations cannot be authenticated directly from this independent website. Google Finance has no supported public market-movers API. The stock list in this static GitHub Pages build is a saved ZenBot snapshot captured November 25, 2026 at 1:42 PM ET; it is not live and will become stale. The app does not pretend this snapshot is live. Live weather comes from Open-Meteo and NWS. A separate server-side market endpoint would be needed to provide refreshing market movers.

## Install on iPhone
Open the published HTTPS site in Safari → Share → Add to Home Screen → Add.
