import { Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
export interface PatMessagePayload {
    chatroom: string;
    fromusername: string;
    chatusername: string;
    pattedusername: string;
    template: string;
}
export declare function isPatMessage(message: Message.AsObject): Promise<boolean>;
export declare function patMessageParser(message: Message.AsObject): Promise<PatMessagePayload>;
//# sourceMappingURL=message-pat.d.ts.map