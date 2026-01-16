export type TtsRequest = {
  characterId: string;
  text: string;
};

export type TtsJobStatus = "pending" | "completed" | "failed";

export type TtsResponse = {
  audioUrl: string;
  jobId?: string;
  status?: TtsJobStatus;
};
