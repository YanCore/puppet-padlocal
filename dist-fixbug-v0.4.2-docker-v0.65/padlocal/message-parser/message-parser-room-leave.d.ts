import { Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
import { Puppet } from "wechaty-puppet";
import { MessageParserRetType } from "./message-parser";
export declare function removeRoomLeaveDebounce(roomId: string, removeeId: string): void;
export declare function isRoomLeaveDebouncing(roomId: string, removeeId: string): boolean;
declare const _default: (puppet: Puppet, message: Message.AsObject) => Promise<MessageParserRetType>;
export default _default;
//# sourceMappingURL=message-parser-room-leave.d.ts.map