## Peak vs. Quiet Periods (per Event Location)
- For each event, convert its local clock:
  - **Peak** = 08:00–20:00 local time  
  - **Quiet** = hours outside that window

## Scraping Frequency Rules
- **During Peak (local)**  
  - If new items: run again in 15 min (max 6 h continuous)  
  - If none: run in 30 min  
- **During Quiet (local)**  
  - If new items: run in 1 h  
  - If none: run in 4–6 h (at least once every 12 h)  
- **After 3+ consecutive empty scrapes**: stop until daily cron at 15:00 UTC  
- Never scrape more often than every 30 min.  
- On failures: exponential backoff.

# DECISION MATRIX

| Period (local) | New Items? | Next Run Delay      |
| -------------- | ---------- | ------------------- |
| Peak & items   | yes        | 30 min              |
| Peak & empty   | no         | 30 min              |
| Quiet & items  | yes        | 1 h                 |
| Quiet & empty  | no         | 4–6 h (≥12 h min)   |
| 3+ empties     | no         | await next-day cron |
