export type ChatMessageValueObject = {
  type: 'chat' | 'typing' | 'system' | 'users' | 'connected';
  user?: string;
  text?: string;
  file?: { name: string; data: string };
  users?: string[];
  userUuid?: string;
};
