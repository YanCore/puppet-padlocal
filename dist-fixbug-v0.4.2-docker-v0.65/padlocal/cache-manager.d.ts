import { FriendshipPayload, RoomInvitationPayload } from "wechaty-puppet";
import { ChatRoomMember, Contact, Label, Message, MessageRevokeInfo, SearchContactResponse } from "padlocal-client-ts/dist/proto/padlocal_pb";
export declare type RoomMemberMap = {
    [contactId: string]: ChatRoomMember.AsObject;
};
export declare class CacheManager {
    private readonly _userName;
    private _messageCache?;
    private _messageRevokeCache?;
    private _contactCache?;
    private _contactSearchCache?;
    private _contactStrangerAliasCache?;
    private _roomCache?;
    private _roomMemberCache?;
    private _roomInvitationCache?;
    private _friendshipCache?;
    private _labelList?;
    constructor(userName: string);
    init(): Promise<void>;
    close(): Promise<void>;
    /**
     * -------------------------------
     * Message Section
     * --------------------------------
     */
    getMessage(messageId: string): Promise<Message.AsObject | undefined>;
    setMessage(messageId: string, payload: Message.AsObject): Promise<void>;
    hasMessage(messageId: string): Promise<boolean>;
    getMessageRevokeInfo(messageId: string): Promise<MessageRevokeInfo.AsObject | undefined>;
    setMessageRevokeInfo(messageId: string, messageSendResult: MessageRevokeInfo.AsObject): Promise<void>;
    /**
     * -------------------------------
     * Contact Section
     * --------------------------------
     */
    getContact(contactId: string): Promise<Contact.AsObject | undefined>;
    setContact(contactId: string, payload: Contact.AsObject): Promise<void>;
    deleteContact(contactId: string): Promise<void>;
    getContactIds(): Promise<string[]>;
    getAllContacts(): Promise<Contact.AsObject[]>;
    hasContact(contactId: string): Promise<boolean>;
    getContactCount(): Promise<number>;
    /**
     * contact search
     */
    getContactSearch(id: string): Promise<SearchContactResponse.AsObject | undefined>;
    setContactSearch(id: string, payload: SearchContactResponse.AsObject): Promise<void>;
    hasContactSearch(id: string): Promise<boolean>;
    getContactStrangerAlias(encryptedUserName: string): Promise<string | undefined>;
    setContactStrangerAlias(encryptedUserName: string, alias: string): Promise<void>;
    deleteContactStrangerAlias(encryptedUserName: string): Promise<void>;
    /**
     * -------------------------------
     * Room Section
     * --------------------------------
     */
    getRoom(roomId: string): Promise<Contact.AsObject | undefined>;
    setRoom(roomId: string, payload: Contact.AsObject): Promise<void>;
    deleteRoom(roomId: string): Promise<void>;
    getRoomIds(): Promise<string[]>;
    getRoomCount(): Promise<number>;
    hasRoom(roomId: string): Promise<boolean>;
    /**
     * -------------------------------
     * Room Member Section
     * --------------------------------
     */
    getRoomMember(roomId: string): Promise<RoomMemberMap | undefined>;
    setRoomMember(roomId: string, payload: RoomMemberMap): Promise<void>;
    deleteRoomMember(roomId: string): Promise<void>;
    /**
     * -------------------------------
     * Room Invitation Section
     * -------------------------------
     */
    getRoomInvitation(messageId: string): Promise<RoomInvitationPayload | undefined>;
    setRoomInvitation(messageId: string, payload: RoomInvitationPayload): Promise<void>;
    deleteRoomInvitation(messageId: string): Promise<void>;
    /**
     * -------------------------------
     * Friendship Cache Section
     * --------------------------------
     */
    getFriendshipRawPayload(id: string): Promise<FriendshipPayload | undefined>;
    setFriendshipRawPayload(id: string, payload: FriendshipPayload): Promise<void>;
    getLabelList(): Label[] | undefined;
    setLabelList(labelList: Label[]): void;
}
//# sourceMappingURL=cache-manager.d.ts.map