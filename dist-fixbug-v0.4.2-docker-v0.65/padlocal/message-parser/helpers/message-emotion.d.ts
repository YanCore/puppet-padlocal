import { Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
export interface EmojiMessagePayload {
    type: number;
    len: number;
    md5: string;
    cdnurl: string;
    width: number;
    height: number;
    gameext?: string;
}
export declare function emotionPayloadParser(message: Message.AsObject): Promise<EmojiMessagePayload>;
export declare function emotionPayloadGenerator(emojiMessagePayload: EmojiMessagePayload): string;
//# sourceMappingURL=message-emotion.d.ts.map