# How I Turn Tech Blogs into a Personal Podcast Using Node.js

These days it feels almost impossible to keep up with tech.

I step away for three days and suddenly there is a new AI model, a new framework, and a new tool everyone says I must learn. Reading everything no longer scales, but I still want to stay informed.

So I decided to change the format instead of giving up.

I took a few tech blogs I already enjoy reading, picked the best articles, converted them to audio using my own voice, and turned the result into a private podcast. Now I stay up to date while walking, running, or driving.

In this tutorial, I will show you how to build a simplified version of that pipeline step by step.

## Table of Contents

- [What You Are Going to Build](#what-you-are-going-to-build)
- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [How to Get the Content](#how-to-get-the-content)
- [How to Filter the Content](#how-to-filter-the-content)
- [How to Clean Up the Content](#how-to-clean-up-the-content)
- [How to Convert Content to Audio](#how-to-convert-content-to-audio)
- [Uploading the Audio to Cloudflare R2](#uploading-the-audio-to-cloudflare-r2)
- [How to Make the Podcast](#how-to-make-the-podcast)
- [How to Automate the Pipeline](#how-to-automate-the-pipeline)
- [Conclusion](#conclusion)

## What You Are Going to Build

You will build a Node.js script that does the following:

- Fetches articles from RSS feeds
- Extracts clean, readable text from each article
- Filters out content you do not want to listen to
- Cleans the text so it sounds good when spoken
- Converts the text to natural-sounding audio using your own voice
- Uploads the audio to Cloudflare R2
- Generates a podcast RSS feed
- Runs automatically on a schedule

At the end, you will have a real podcast feed you can subscribe to on your phone.

> Screenshot: The generated podcast showing converted blog posts as episodes.

If you want to skip the tutorial and jump straight into using the finished tool, you can find the complete version and instructions on GitHub.

## Prerequisites

To follow along, you need basic JavaScript knowledge.

You also need:

- Node.js 22 or newer
- A place to store audio files (Cloudflare R2 in this tutorial)
- A text-to-speech API (OrangeClone in this tutorial)

## Project Overview

Before writing code, it helps to understand the idea clearly.

This project is a pipeline:

```text
Fetch content -> Filter content -> Clean up content -> Convert to audio -> Repeat
```

Each step takes the output of the previous one. Keeping the flow linear makes the project easier to reason about, debug, and automate.

All code in this tutorial lives in a single file called `index.js`.

## Getting Started

Create a new project folder and your main file.

```bash
mkdir podcast-pipeline
cd podcast-pipeline
touch index.js
```

Initialize the project and install dependencies.

```bash
npm init -y
npm install rss-parser @mozilla/readability jsdom node-fetch uuid xmlbuilder @aws-sdk/client-s3
```

Enable ESM so `import` syntax works in Node 22.

```bash
npm pkg set type=module
```

Here is what each dependency is used for:

- `rss-parser` reads RSS feeds
- `@mozilla/readability` extracts readable article text
- `jsdom` provides a DOM for Readability
- `node-fetch` fetches remote content
- `uuid` generates unique filenames
- `xmlbuilder` creates the podcast RSS feed
- `@aws-sdk/client-s3` uploads audio to Cloudflare R2

## How to Get the Content

The first decision is where your content comes from.

Avoid scraping websites directly. Scraped HTML is noisy and inconsistent. RSS feeds are structured and reliable. Most serious blogs provide one.

Open `index.js` and define your sources.

```js
import Parser from "rss-parser";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const parser = new Parser();

const NUMBER_OF_ARTICLES_TO_FETCH = 15;

const SOURCES = [
  "https://www.freecodecamp.org/news/rss/",
  "https://hnrss.org/frontpage",
];
```

Now fetch articles and extract readable content.

```js
async function fetchArticles() {
  const articles = [];

  for (const source of SOURCES) {
    const feed = await parser.parseURL(source);

    for (const item of feed.items.slice(0, NUMBER_OF_ARTICLES_TO_FETCH)) {
      if (!item.link) continue;

      const response = await fetch(item.link);
      const html = await response.text();

      const dom = new JSDOM(html, { url: item.link });
      const reader = new Readability(dom.window.document);
      const content = reader.parse();

      if (!content) continue;

      articles.push({
        title: item.title,
        link: item.link,
        content: content.content,
        text: content.textContent,
      });
    }
  }

  return articles.slice(0, NUMBER_OF_ARTICLES_TO_FETCH);
}
```

This function:

- Reads RSS feeds
- Downloads each article
- Extracts clean text using Readability
- Returns a list of articles ready for processing

## How to Filter the Content

Not every article deserves your attention.

Start by filtering out topics you do not want to hear about.

```js
const BLOCKED_KEYWORDS = ["crypto", "nft", "giveaway"];

function filterByKeywords(articles) {
  return articles.filter(
    (article) =>
      !BLOCKED_KEYWORDS.some((keyword) =>
        article.text.toLowerCase().includes(keyword)
      )
  );
}
```

Next, remove promotional content.

```js
function removePromotionalContent(articles) {
  return articles.filter(
    (article) => !article.text.toLowerCase().includes("sponsored")
  );
}
```

Finally, remove articles that are too short.

```js
function filterByWordCount(articles, minWords = 700) {
  return articles.filter(
    (article) => article.text.split(/\s+/).length >= minWords
  );
}
```

After these steps, you are left with articles you actually want to listen to.

## How to Clean Up the Content

Raw article text still needs cleanup to sound good when spoken.

First, replace images with spoken placeholders.

```js
function replaceImages(html) {
  return html.replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (_, alt) => {
    return alt ? `[Image: ${alt}]` : `[Image omitted]`;
  });
}
```

Next, remove code blocks.

```js
function replaceCodeBlocks(html) {
  return html.replace(
    /<pre><code>[\s\S]*?<\/code><\/pre>/gi,
    "[Code example omitted]"
  );
}
```

Strip URLs and replace them with spoken text.

```js
function replaceUrls(text) {
  return text.replace(/https?:\/\/\S+/gi, "link removed");
}
```

Normalize common symbols.

```js
function normalizeSymbols(text) {
  return text
    .replace(/&/g, "and")
    .replace(/%/g, "percent")
    .replace(/\$/g, "dollar");
}
```

Convert HTML to text so TTS does not read tags.

```js
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ");
}
```

Combine everything into one cleanup step.

```js
function cleanArticle(article) {
  let cleaned = replaceImages(article.content);
  cleaned = replaceCodeBlocks(cleaned);
  cleaned = stripHtml(cleaned);
  cleaned = replaceUrls(cleaned);
  cleaned = normalizeSymbols(cleaned);

  return {
    ...article,
    cleanedText: cleaned,
  };
}
```

At this point, the text is ready for audio generation.

## How to Convert Content to Audio

Browser speech APIs sound robotic. I wanted something that sounded human and familiar.

After trying several tools, I settled on OrangeClone. It was the only option that actually sounded like me.

Create a free account and copy your API key from the dashboard.

> Screenshot: OrangeClone dashboard with API key visible.

Record 10 to 15 seconds of clean audio and save it as `SAMPLE_VOICE.wav` in the project root.

Create a voice character (one-time setup).

```js
import fs from "node:fs/promises";
import path from "node:path";

const ORANGECLONE_API_KEY = process.env.ORANGECLONE_API_KEY;
const ORANGECLONE_BASE_URL =
  process.env.ORANGECLONE_BASE_URL || "https://orangeclone.com/api";

async function createVoiceCharacter({ name, avatarStyle, voiceSamplePath }) {
  const buffer = await fs.readFile(voiceSamplePath);
  const fileName = path.basename(voiceSamplePath);
  const blob = new Blob([new Uint8Array(buffer)], { type: "audio/wav" });

  const formData = new FormData();
  formData.append("name", name);
  formData.append("avatarStyle", avatarStyle);
  formData.append("voiceFile", blob, fileName);

  const response = await fetch(`${ORANGECLONE_BASE_URL}/characters/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ORANGECLONE_API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.data?.id || data.data?.characterId || data.id || data.characterId;
}
```

Generate audio from text.

```js
async function generateAudio(characterId, text) {
  const response = await fetch("https://api.orangeclone.com/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ORANGECLONE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      characterId,
      text,
    }),
  });

  return response.json();
}
```

Wait for the job to complete.

```js
async function waitForAudio(jobId) {
  while (true) {
    const response = await fetch(`https://api.orangeclone.com/tts/${jobId}`);
    const data = await response.json();

    if (data.status === "completed") {
      return data.audioUrl;
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}
```

## Uploading the Audio to Cloudflare R2

OrangeClone returns an audio URL, but podcast apps need a stable, public file.

That is where Cloudflare R2 comes in.

### Setting up credentials

Create an R2 bucket and set these environment variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### Initializing the R2 client

```js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

### Downloading the audio

```js
async function downloadAudio(audioUrl) {
  const response = await fetch(audioUrl);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}
```

### Uploading to R2

```js
import { v4 as uuid } from "uuid";

async function uploadToR2(audioBuffer) {
  const fileName = `${uuid()}.mp3`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: audioBuffer,
    ContentType: "audio/mpeg",
  });

  await r2.send(command);

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}
```

Putting it together:

```js
const audioUrl = await waitForAudio(jobId);
const audioBuffer = await downloadAudio(audioUrl);
const publicAudioUrl = await uploadToR2(audioBuffer);
```

`publicAudioUrl` is the final audio file used in the podcast feed.

## How to Make the Podcast

With public audio URLs, you can now generate an RSS feed.

```js
import xmlbuilder from "xmlbuilder";

function generatePodcastFeed(episodes) {
  const feed = xmlbuilder
    .create("rss", { version: "1.0" })
    .att("version", "2.0")
    .ele("channel");

  feed.ele("title", "My Tech Podcast");
  feed.ele("description", "Tech articles converted to audio");
  feed.ele("link", "https://your-site.com");

  episodes.forEach((ep) => {
    const item = feed.ele("item");
    item.ele("title", ep.title);
    item.ele("enclosure", {
      url: ep.audioUrl,
      type: "audio/mpeg",
    });
  });

  return feed.end({ pretty: true });
}
```

Host this RSS file on GitHub Pages and add it to Apple Podcasts.

> Screenshot: Subscribing to the generated RSS feed in Apple Podcasts.

## How to Automate the Pipeline

Automation in this project happens in two stages.

First, the code itself must be able to process multiple articles in one run.
Second, the script must run automatically on a schedule.

We will start with the code-level automation.

### Automating inside the code

Earlier, we fetched up to 15 articles. Now we need to make sure every article that passes our filters goes through the full pipeline.

Add the following function near the bottom of `index.js`.

```js
async function runPipeline() {
  const rawArticles = await fetchArticles();

  const filteredArticles = filterByWordCount(
    removePromotionalContent(filterByKeywords(rawArticles))
  );

  if (filteredArticles.length === 0) {
    console.log("No articles passed the filters");
    return [];
  }

  const characterId = await createVoiceCharacter({
    name: "My Voice",
    avatarStyle: "realistic",
    voiceSamplePath: "./SAMPLE_VOICE.wav",
  });

  const episodes = [];

  for (const article of filteredArticles) {
    console.log(`Processing: ${article.title}`);

    const cleaned = cleanArticle(article);

    const job = await generateAudio(characterId, cleaned.cleanedText);

    const audioUrl = await waitForAudio(job.id);
    const audioBuffer = await downloadAudio(audioUrl);
    const publicAudioUrl = await uploadToR2(audioBuffer);

    episodes.push({
      title: article.title,
      audioUrl: publicAudioUrl,
    });
  }

  return episodes;
}
```

This function does all the heavy lifting:

- fetches articles
- applies all filters
- creates the voice character once
- loops through every valid article
- converts each article into audio
- uploads the audio to Cloudflare R2
- collects podcast episode data

At this point, one script run can generate multiple podcast episodes.

### Running the pipeline and generating the feed

Now we need a single entry point that runs the pipeline and writes the podcast feed.

Add this below the pipeline function.

```js
import fs from "node:fs/promises";

async function main() {
  const episodes = await runPipeline();

  if (episodes.length === 0) {
    console.log("No episodes generated");
    return;
  }

  const rss = generatePodcastFeed(episodes);

  await fs.mkdir("./public", { recursive: true });
  await fs.writeFile("./public/feed.xml", rss);

  console.log("Podcast feed generated at public/feed.xml");
}

main().catch(console.error);
```

When you run `node index.js`, this now:

- processes all selected articles
- creates multiple audio files
- generates a valid podcast RSS feed

This is the core automation.

### Scheduling the pipeline with GitHub Actions

The final step is to make this script run automatically.

Create a GitHub Actions workflow file at `.github/workflows/podcast.yml`.

```yaml
name: Podcast Pipeline

on:
  schedule:
    - cron: "0 6 * * *"

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: node index.js
        env:
          ORANGECLONE_API_KEY: ${{ secrets.ORANGECLONE_API_KEY }}
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
          R2_PUBLIC_URL: ${{ secrets.R2_PUBLIC_URL }}
```

This workflow runs the pipeline every morning at 6 AM.

Each run:

- fetches new articles
- generates fresh audio
- updates the podcast feed

Once this is set up, your podcast updates itself without manual work.

## Conclusion

This is a basic version of my full production pipeline, PostCast, but the core idea is the same.

You now know how to turn blogs into a personal podcast. Be mindful of copyright and only use content you are allowed to consume.

If you have questions, reach me on X at `@sprucekhalifa`. I write practical tech articles like this regularly.
