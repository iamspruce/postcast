export type VoiceState = {
  voiceId?: string;
  characterId?: string;
  createdAt: string;
  updatedAt: string;
};

export type State = {
  voice: VoiceState;
};
