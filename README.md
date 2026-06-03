# ThirtyTwo Coffee · Order Form

Static order form (frontend) + small Node/Express backend that forwards orders to Telegram (message + uploaded payment screenshot).

## 1) Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your env file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env`:
   - `BOT_TOKEN` (or `TELEGRAM_BOT_TOKEN`): your Telegram Bot token (from @BotFather)
   - `CHAT_ID` (or `TELEGRAM_CHAT_ID`): the chat/user/group ID to receive orders

## 2) Run

```bash
npm run dev
```

Open:
`http://localhost:3000`

## Notes

- The bot token stays on the server (recommended). The frontend posts to `POST /api/submit-order`.
- Upload size limit is 10MB.
- To get your personal `CHAT_ID` quickly, message **@userinfobot** in Telegram and copy the numeric ID it returns.
- For supergroups, the `chat_id` is usually negative and often looks like `-100xxxxxxxxxx`.
