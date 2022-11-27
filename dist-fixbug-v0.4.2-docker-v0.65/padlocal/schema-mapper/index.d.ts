import { ChatRoomMember, Contact, Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
import { ContactPayload, MessagePayload, Puppet, RoomMemberPayload, RoomPayload } from "wechaty-puppet";
export declare function padLocalMessageToWechaty(puppet: Puppet, message: Message.AsObject): Promise<MessagePayload>;
export declare function padLocalContactToWechaty(contact: Contact.AsObject): ContactPayload;
export declare function padLocalRoomToWechaty(contact: Contact.AsObject): RoomPayload;
export declare function padLocalRoomMemberToWechaty(chatRoomMember: ChatRoomMember.AsObject): RoomMemberPayload;
export declare function chatRoomMemberToContact(chatRoomMember: ChatRoomMember): Contact;
//# sourceMappingURL=index.d.ts.map