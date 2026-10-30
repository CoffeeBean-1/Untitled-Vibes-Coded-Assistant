# Outlook calendar connection



The selected first connection is a **published ICS subscription**, read-only and calendar-only. No client ID or Microsoft sign-in is needed. CAi does not request inbox access or calendar writes.



1. Start CAi with `Start-CAi.cmd`; open http://127.0.0.1:5173/ and refresh the page.

2. Open **Settings → Outlook calendar**. Paste the ICS subscription URL into the masked field and select **Connect calendar**. Use the published .ics feed, not an Outlook web page or a downloaded file. Do not paste the private URL into chat.

3. Return to Dashboard. Check a few titles/times against Outlook and expand the agenda. A Join button appears only when the published details contain a supported meeting link. A feed publishing availability only cannot supply missing titles or links.

4. Calendar options use the device time zone for all-day/floating events. An optional calendar email can filter attendee responses marked declined; it only matches text already in the ICS feed, with no inbox connection. Feeds that omit attendee responses cannot reliably identify declined invitations.



Supported feed hosts are outlook.office365.com, outlook.office.com, outlook.live.com, outlook.office365.us and outlook.office.de over HTTPS, with a path ending .ics. webcal is normalized to HTTPS. Redirects must remain within that list. Other hosts return an actionable error; do not weaken the allowlist to work around a corporate wrapper without reviewing its destination. Organizational publication settings may restrict available feeds or detail levels.



CAi refreshes every two minutes while visible, on return after at least 30 seconds, and on request. Outlook can delay published feed updates, so this is not an immediate sync guarantee. The view covers yesterday through the next 14 days, using a stable UTC window. All-day events stay in the agenda. Recurring/moved/cancelled events, tentative status and conflicts are handled where supplied. Unsupported zones/complex recurrence are marked incomplete. Open the Calendar tab for the day-grouped agenda, range filters/search and selected-meeting details. Results display 50 events per page within the loaded window; Outlook remains the full calendar. The dashboard is a quiet four-row meeting list with day/time and relative minutes below an hour, then hours/days. Select a row for full Calendar details. A paired phone/video control opens the original supported join link; choose mic/camera settings in the provider app.



Failed refreshes retain the last successful data with a warning and timestamp. Provider throttling is respected. A new connection clears prior calendar data before reading the replacement. Disconnect clears the link, events, validators and optional email; late old responses cannot repopulate the session. No sample fallback appears after a live connection fails or disconnects.



The link is a bearer capability: anyone holding it can read the published details. CAi keeps it and normalized calendar data in local process/browser memory only, outside task storage, exports and logs. The browser gets a random HttpOnly SameSite cookie identifying its local session. Reloads retain the connection while CAi runs. Restarting the process or eight hours without requests requires re-pasting the link. Disconnecting CAi does not revoke the published URL; unpublish the calendar in Outlook for that. Browser extensions and other software with access to your browser/computer remain outside this boundary.



The local reader runs only in Vite dev/preview, bound to 127.0.0.1. No hosted relay or cloud service is used. Static dist hosting alone cannot fetch the feed. No actual user URL has been tested during implementation; first real-feed validation is the owner's local check above. Avoid screenshots/recordings containing actual meeting details or links.



## Optional future Microsoft sign-in



Graph remains a separate option if published feeds prove too slow or incomplete. It needs an Entra application registration; its public client ID identifies CAi at Microsoft sign-in and is not a secret or permission grant. Start with delegated Calendars.ReadBasic where adequate. Invitation-body extraction would require an explained Calendars.Read expansion. Never request Mail.Read or calendar writes. No Graph registration, token or identity adapter was created here.



References: [Microsoft calendar sharing in Outlook on the web](https://support.microsoft.com/en-us/outlook/share-your-calendar-in-outlook-on-the-web), [Outlook.com calendar publishing](https://support.microsoft.com/en-us/outlook/share-your-calendar-in-outlook-com), [browser CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS). The local reader handles cross-origin fetching without weakening browser protections.

