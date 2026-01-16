# PostCast

Keeping up with tech these days is hard. New ideas, tools, and opinions show up constantly, and it’s even harder to find a podcast that consistently covers the specific things I care about.

So I decided to make my own.

PostCast turns the sources I already enjoy reading into a podcast, narrated in my own voice, so I can listen while running, walking, or driving.

What this project really comes down to is simple: quality content and quality audio. The content part is easy—I already know the sources I trust. PostCast pulls from those sources and runs them through a pipeline that filters, cleans, and scores the articles before selecting what’s worth turning into an episode.

For the audio, I tried a lot of AI voice cloning and text-to-speech tools. Most of them sounded robotic, and in many cases I couldn’t even recognize my own voice. OrangeClone was the first one that actually sounded natural and close to my real voice, which is why it’s the default here. The TTS layer is fully swappable though, so you’re free to use any provider you prefer. If you want a good starting point, I recommend https://orangeclone.com.

## Features

- Curated RSS ingestion with configurable sources
- Article extraction using Mozilla Readability
- Modular rules pipeline for filtering, cleaning, and scoring
- Text-to-speech via OrangeClone (swappable TTS provider)
- Audio uploads to Cloudflare R2 (S3-compatible)
- Podcast RSS feed generation with episode metadata JSON

---

## How it works

```
RSS fetch → extract → rules → score → select → TTS → upload → RSS
```

### Outputs

- `public/rss.xml` — podcast feed
- `public/episodes.json` — latest episode metadata

---

## Requirements

- Node.js 22+ (TypeScript build)
- OrangeClone account and API key (or your own TTS provider)
- Cloudflare R2 bucket with a public base URL

---

## Quick start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the required values
3. Install dependencies and run:

```bash
npm install
npm run build
npm start
```

For local development:

```bash
npm run dev
```

---

## Configuration

All configuration is loaded from environment variables in `src/config.ts`.

| Variable                        | Required | Description                                                 |
| ------------------------------- | -------- | ----------------------------------------------------------- |
| `ORANGECLONE_API_KEY`           | yes      | OrangeClone API key                                         |
| `ORANGECLONE_BASE_URL`          | yes      | OrangeClone API base URL                                    |
| `ORANGECLONE_CHARACTER_ID`      | no       | Existing character ID. If empty, a new character is created |
| `ORANGECLONE_CHARACTER_NAME`    | yes\*    | Character name when creating a new character                |
| `ORANGECLONE_CHARACTER_AVATAR`  | yes\*    | Avatar name for the character                               |
| `ORANGECLONE_VOICE_SAMPLE_PATH` | yes\*    | Path to a voice sample WAV file                             |
| `R2_ACCOUNT_ID`                 | yes      | Cloudflare R2 account ID                                    |
| `R2_ACCESS_KEY_ID`              | yes      | R2 access key ID                                            |
| `R2_SECRET_ACCESS_KEY`          | yes      | R2 secret access key                                        |
| `R2_BUCKET`                     | yes      | R2 bucket name for audio uploads                            |
| `R2_PUBLIC_BASE_URL`            | yes      | Public base URL for audio files                             |
| `PODCAST_TITLE`                 | yes      | Podcast title                                               |
| `PODCAST_DESCRIPTION`           | yes      | Podcast description                                         |
| `PODCAST_LANGUAGE`              | no       | Language code (default: `en-us`)                            |
| `PODCAST_AUTHOR`                | yes      | Author name in RSS                                          |
| `PODCAST_EMAIL`                 | yes      | Contact email for RSS                                       |
| `PODCAST_SITE_URL`              | yes      | Website URL referenced in RSS                               |
| `LOOKBACK_HOURS`                | no       | Time window to consider articles                            |
| `MAX_CANDIDATES`                | no       | Maximum articles to score per run                           |
| `EPISODES_PER_RUN`              | no       | Episodes to publish per run                                 |

- Required only when `ORANGECLONE_CHARACTER_ID` is empty.

When no character ID is provided, PostCast will create a new character using the provided name, avatar, and voice sample, then persist the generated IDs in `data/state.json` for reuse.

---

## Add or remove rules

Rules are fully modular.

Edit `src/rules/index.ts` to add or remove entries from:

- `filterRules`
- `cleanerRules`
- `scoreRules`

Each rule is a small module with a stable interface, making the pipeline easy to extend without breaking existing behavior.

---

## Add sources

To add new content sources, edit `src/sources/index.ts`:

```ts
{
  id: "my-source",
  title: "My Source",
  feedUrl: "https://example.com/rss.xml",
  siteUrl: "https://example.com"
}
```

---

## Troubleshooting extraction issues

- **`Readability failed to extract article`**
  The site may rely heavily on client-side rendering or aggressive scripts. Try a reader-friendly URL or a different source.

- **Too many `Rejected` logs**
  Adjust thresholds in `src/rules/index.ts`.

- **HTML fetch failures**
  Inspect the HTTP status code. You may need a custom `User-Agent` or a proxy.

---

## Rotate or regenerate the voice

To regenerate the voice or character:

- Delete `data/state.json`, or
- Remove `voiceId` from the file

On the next run, PostCast will create a new character and voice.

---

## Project structure

- `src/` — core pipeline and modules
- `src/rules/` — filter, clean, and score rules
- `src/sources/` — RSS sources
- `src/tts/` — text-to-speech providers
- `src/rss/` — RSS templates and builder
- `public/` — generated RSS and metadata
- `data/` — local state (character and voice IDs)

---

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss scope and approach.

---

## License

MIT. See `LICENSE`.
