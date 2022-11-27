import { Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
import { MessageCategory, ParsedMessage, ParsedMessagePayloadSpec } from "./message-parser-type";
import { Puppet } from "wechaty-puppet";
export declare type MessageParserRetType = ParsedMessagePayloadSpec[keyof ParsedMessagePayloadSpec] | null;
export declare type MessageParser = (puppet: Puppet, message: Message.AsObject) => Promise<MessageParserRetType>;
export declare function registerMessageParser(category: MessageCategory, parser: MessageParser): void;
export declare function parseMessage(puppet: Puppet, message: Message.AsObject): Promise<ParsedMessage<any>>;
//# sourceMappingURL=message-parser.d.ts.map