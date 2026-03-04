
export type ChatMessageValueObject = {
  type: 'chat' | 'typing' | 'system' | 'users' | 'connected';
  timestamp?: number;
  isEncrypted?: boolean;
  user?: string;
  text?: string;
  file?: { name: readonly string[]; data: readonly string[] };
  users?: readonly string[] | string[];
  userUuid?: string;
};

export type IncomingChatMessageValueObject = ChatMessageValueObject & {
  type: 'chat'
  file?: { name: string; data: string };
}
