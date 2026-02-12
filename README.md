# Miniature Borough

A daily tile-placement puzzle game on Reddit, built with [Devvit](https://developers.reddit.com/).

## What It Is

You get a **6×6 grid** and **10 turns**. Each turn you choose one of two tiles and place it in an allowed row or column. **Rocks** are fixed obstacles. Your goal is to **maximize your score** by placing tiles so they score points according to the rules below.

- **Daily puzzle:** Everyone gets the same board and tile sequence each UTC day.
- **3 attempts per post:** Each user has up to 3 completed games per post; best score is kept.

## How to Play

1. Open a Miniature Borough post in the subreddit where the app is installed.
2. Tap the **?** next to the title to open the rules.
3. Each turn you see **two tile options** (with a row or column constraint). **Pick one**, then tap an empty (green) cell in the allowed row or column to place it.
4. The **Next** row shows the two tiles you’ll get next turn.
5. After 10 turns the game ends. Your final score is the sum of all tile scores. Try to beat your best (you have 3 attempts per post).

## Scoring (1pt each)

| Tile    | How it scores |
|---------|----------------|
| Mountain | 1pt for each **nearby** tree (8 surrounding cells). |
| Tree    | 1pt for each **touching** tree (4 orthogonally adjacent). |
| Farm    | 1pt for each **touching** grass cell. |
| Castle  | 1pt for each grass cell on the **shortest path** to the nearest house. |
| House   | 1pt per **unique tile type** in the 8 surrounding cells. |

- **Nearby** = any of the 8 cells around the tile.  
- **Touching** = only the 4 orthogonally adjacent cells (up, down, left, right).

## Tech & Commands

- **Stack:** Devvit, React, Vite, TypeScript, Express, Tailwind.
- `npm run dev` — Run client + server + Devvit playtest.
- `npm run build` — Build client and server.
- `npm run deploy` — Upload app; `npm run launch` — Publish for review.
- `npm run login` — Log in to Reddit CLI; `npm run check` — Type-check, lint, format.

## License

BSD-3-Clause (see [LICENSE](LICENSE)).
