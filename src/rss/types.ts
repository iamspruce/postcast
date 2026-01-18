export type RssItem = {
  title: string;
  description: string;
  guid: string;
  pubDate: string;
  enclosureUrl: string;
  enclosureLength: number;
  sourceUrl: string;
  sourceId: string;
  author: string;
};

export type RssChannel = {
  title: string;
  description: string;
  link: string;
  language: string;
  author: string;
  email: string;
  imageUrl?: string;
  items: RssItem[];
};
