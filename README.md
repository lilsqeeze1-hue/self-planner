# Self-Planner

Telegram Mini App for shared tasks, trips, places, wishes and expenses.

## Vercel setup

1. Import this repository into Vercel.
2. In **Storage**, create a **Neon Postgres** database and connect it to the project.
3. Add these environment variables for Production:

   - `BOT_TOKEN` — the current token from BotFather.
   - `ALLOWED_TELEGRAM_ID_1` — `339965590`.
   - `ALLOWED_TELEGRAM_ID_2` — add the second Telegram ID later.
   - `DATABASE_URL` — added automatically by the Neon integration.

4. Deploy the project.
5. In BotFather run `/setmenubutton`, select `@Vmeste777Bot`, set the button text
   to `Открыть Self-Planner`, and paste the Vercel production URL.

Never commit tokens or `.env` files.
