import { config } from "../config";
import { RssChannel } from "./types";

export function defaultChannel(items: RssChannel["items"]): RssChannel {
  return {
    title: config.podcast.title,
    description: config.podcast.description,
    link: config.podcast.siteUrl,
    language: config.podcast.language,
    author: config.podcast.author,
    email: config.podcast.email,
    items,
  };
}
