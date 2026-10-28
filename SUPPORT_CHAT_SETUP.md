# MIYO support chat setup

The widget creates one Telegram forum topic per website conversation. User/support messages are temporarily stored in the existing spreadsheet. When the visitor cancels or the conversation has been inactive for seven days, the transcript is archived as a private JSON file in Drive, then the Telegram topic and temporary spreadsheet rows are deleted. A closed chat cannot be reopened; the visitor must start a new one.

## Telegram requirements

1. Create a **private supergroup** for support and enable **Topics**.
2. Add the support bot as an administrator with permission to manage topics and messages. Keep the group private and limit membership to trusted support staff; any human who can write in a topic can reply to that visitor.
3. For incoming staff replies, the bot must receive messages in topics. Make the bot an administrator (or disable BotFather privacy mode). Reply in the visitor's topic. Send `/cancel` there to archive and close that conversation.
4. The fast setup uses a Cloudflare Worker webhook. The Worker checks Telegram's webhook secret and forwards updates to Apps Script. Do not run `setupSupportChat()` after switching to webhook mode; that function is for the slower one-minute polling fallback.

## Apps Script configuration

In the deployed Apps Script project's **Project Settings → Script properties**, configure:

- `SUPPORT_BOT_TOKEN` — bot token; never place it in website files or Git.
- `SUPPORT_GROUP_ID` — numeric ID of the private forum supergroup (often a negative number).
- `SUPPORT_ARCHIVE_FOLDER_ID` — ID of a Drive folder whose sharing is restricted to the owner/trusted administrators. Do not share it publicly or publish its contents.
- `SUPPORT_WEBHOOK_URL` — deployed Worker origin, such as `https://miyo.<account-subdomain>.workers.dev` (no trailing slash).
- `SUPPORT_TELEGRAM_WEBHOOK_SECRET` — random secret shared with the Worker as `TELEGRAM_WEBHOOK_SECRET`.
- `SUPPORT_BRIDGE_SECRET` — a different random secret shared with the Worker as `SUPPORT_BRIDGE_SECRET`.

Merge the support-chat additions from `Code.gs` into the **existing deployed Apps Script source**, preserving its real `SPREADSHEET_ID` and `DRIVE_FOLDER_ID` values. The repository intentionally contains placeholders; do not replace the deployed script wholesale with those placeholders. For webhook mode, deploy the new web-app version using the same endpoint, then run `setupSupportChatWebhook()` once from the Apps Script editor. This migrates existing message rows to stable sequence IDs, registers the Worker URL with Telegram, and removes the old Telegram polling trigger. Keep the hourly cleanup trigger.

In Cloudflare Workers & Pages, deploy `cloudflare/miyo-telegram-worker.js` and configure Production variables/secrets: `APPS_SCRIPT_URL`, `TELEGRAM_WEBHOOK_SECRET`, and `SUPPORT_BRIDGE_SECRET`. The two secret values must exactly match Apps Script properties; generate them locally and do not send or commit them. Set `shared/miyo-config.js` `supportChatPollUrl` to the Worker origin so browser polling uses the Worker bridge. The existing `TELEGRAM_TOKEN`/`TELEGRAM_CHAT_ID` properties used for error alerts are separate.

## Operational notes

- Start creation is capped at 20 chats per hour globally; each chat can send 12 messages per minute, up to 1,200 characters each. Webhook delivery is near real time; the browser checks the Worker every five seconds while a session exists.
- Archived transcripts include the visitor/support text and timestamps. They do not include the visitor's access code or form data.
- Deleting a Telegram topic requires the bot to have sufficient group permissions. If Telegram deletion fails, the session stays `CLOSING` and the scheduled cleanup retries; the archive is not duplicated.
- Test only with synthetic messages and a private test group/folder. Do not use real student data during tests.
