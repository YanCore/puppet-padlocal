import { MessageType } from "wechaty-puppet";
import { Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
import { WechatMessageType } from "../WechatMessageType";
export declare function convertMessageType(wechatMessageType: WechatMessageType): MessageType;
export declare function getMessageFileName(message: Message.AsObject, messageType: MessageType): string;
//# sourceMappingURL=message.d.ts.map