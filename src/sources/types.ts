export type FeedItem = {
  sourceId: string;
  feedUrl: string;
  itemId: string;
  title: string;
  link: string;
  publishedAt?: string;
  author?: string;
  content?: string;
};

export type Source = {
  id: string;
  title: string;
  feedUrl: string;
  siteUrl?: string;
};
