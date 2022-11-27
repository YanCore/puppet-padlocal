import { ContactPayload, FileBox, FriendshipPayload, ImageType, MessagePayload, MiniProgramPayload, Puppet, PuppetOptions, RoomInvitationPayload, RoomMemberPayload, RoomPayload, UrlLinkPayload } from "wechaty-puppet";
import { PadLocalClient } from "padlocal-client-ts";
import { ChatRoomMember, Contact, LoginPolicy, Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
import { FriendshipAddOptions } from "wechaty-puppet/dist/src/schemas/friendship";
export declare type PuppetPadlocalOptions = PuppetOptions & {
    serverCAFilePath?: string;
    defaultLoginPolicy?: LoginPolicy;
};
declare class PuppetPadlocal extends Puppet {
    options: PuppetPadlocalOptions;
    private _client?;
    private _cacheMgr?;
    private _onPushSerialExecutor;
    private _printVersion;
    private _restartStrategy;
    private _heartBeatTimer?;
    constructor(options?: PuppetPadlocalOptions);
    get client(): PadLocalClient | undefined;
    start(): Promise<void>;
    private _startClient;
    /**
     * called internally while login success
     * @param userId
     * @protected
     */
    protected login(userId: string): Promise<void>;
    /**
     * stop the bot, with account signed on, will try auto login next time bot start.
     */
    stop(): Promise<void>;
    private _stopClient;
    /**
     * logout account and stop the bot
     */
    logout(): Promise<void>;
    ding(_data?: string): void;
    /****************************************************************************
     * contact
     ***************************************************************************/
    contactSelfName(name: string): Promise<void>;
    contactSelfQRCode(): Promise<string>;
    contactSelfSignature(signature: string): Promise<void>;
    contactAlias(contactId: string): Promise<string>;
    contactAlias(contactId: string, alias: string | null): Promise<void>;
    contactAvatar(contactId: string): Promise<FileBox>;
    contactAvatar(contactId: string, file: FileBox): Promise<void>;
    contactList(): Promise<string[]>;
    contactCorporationRemark(contactId: string, corporationRemark: string | null): Promise<void>;
    contactDescription(contactId: string, description: string | null): Promise<void>;
    contactPhone(contactId: string, phoneList: string[]): Promise<void>;
    contactDelete(contactId: string): Promise<void>;
    /****************************************************************************
     * tag
     ***************************************************************************/
    tagContactAdd(tagName: string, contactId: string): Promise<void>;
    tagContactRemove(tagName: string, contactId: string): Promise<void>;
    tagContactDelete(tagName: string): Promise<void>;
    tagContactList(contactId?: string): Promise<string[]>;
    /****************************************************************************
     * friendship
     ***************************************************************************/
    friendshipAccept(friendshipId: string): Promise<void>;
    friendshipAdd(contactId: string, option?: FriendshipAddOptions): Promise<void>;
    friendshipSearchPhone(phone: string): Promise<null | string>;
    friendshipSearchWeixin(weixin: string): Promise<null | string>;
    private _friendshipSearch;
    private _findRoomIdForUserName;
    /****************************************************************************
     * get message payload
     ***************************************************************************/
    messageContact(_messageId: string): Promise<string>;
    messageFile(messageId: string): Promise<FileBox>;
    messageImage(messageId: string, imageType: ImageType): Promise<FileBox>;
    messageMiniProgram(messageId: string): Promise<MiniProgramPayload>;
    messageUrl(messageId: string): Promise<UrlLinkPayload>;
    /****************************************************************************
     * send message
     ***************************************************************************/
    messageSendContact(toUserName: string, contactId: string): Promise<string>;
    messageSendFile(toUserName: string, fileBox: FileBox): Promise<string>;
    messageSendMiniProgram(toUserName: string, mpPayload: MiniProgramPayload): Promise<string>;
    messageSendText(toUserName: string, text: string, mentionIdList?: string[]): Promise<string>;
    messageSendUrl(toUserName: string, linkPayload: UrlLinkPayload): Promise<string>;
    messageRecall(messageId: string): Promise<boolean>;
    messageForward(toUserName: string, messageId: string): Promise<string>;
    /****************************************************************************
     * room
     ***************************************************************************/
    roomAdd(roomId: string, contactId: string): Promise<void>;
    roomAvatar(roomId: string): Promise<FileBox>;
    roomCreate(contactIdList: string[], topic?: string): Promise<string>;
    roomDel(roomId: string, contactId: string): Promise<void>;
    roomList(): Promise<string[]>;
    roomQRCode(roomId: string): Promise<string>;
    roomQuit(roomId: string): Promise<void>;
    roomTopic(roomId: string): Promise<string>;
    roomTopic(roomId: string, topic: string): Promise<void>;
    roomAnnounce(roomId: string): Promise<string>;
    roomAnnounce(roomId: string, text: string): Promise<void>;
    roomMemberList(roomId: string): Promise<string[]>;
    roomInvitationAccept(roomInvitationId: string): Promise<void>;
    /****************************************************************************
     * RawPayload section
     ***************************************************************************/
    contactRawPayloadParser(payload: Contact.AsObject): Promise<ContactPayload>;
    contactRawPayload(id: string): Promise<Contact.AsObject>;
    messageRawPayloadParser(payload: Message.AsObject): Promise<MessagePayload>;
    messageRawPayload(id: string): Promise<Message.AsObject>;
    roomRawPayloadParser(payload: Contact.AsObject): Promise<RoomPayload>;
    roomRawPayload(id: string): Promise<Contact.AsObject>;
    roomMemberRawPayload(roomId: string, contactId: string): Promise<ChatRoomMember.AsObject>;
    roomMemberRawPayloadParser(rawPayload: ChatRoomMember.AsObject): Promise<RoomMemberPayload>;
    roomInvitationRawPayload(roomInvitationId: string): Promise<RoomInvitationPayload>;
    roomInvitationRawPayloadParser(rawPayload: RoomInvitationPayload): Promise<RoomInvitationPayload>;
    friendshipRawPayload(id: string): Promise<FriendshipPayload>;
    friendshipRawPayloadParser(rawPayload: FriendshipPayload): Promise<FriendshipPayload>;
    /****************************************************************************
     * extra methods section
     ***************************************************************************/
    /**
     * CAUTION: For edge case usage only!
     * Sync contact is a time consuming action, may last for minutes especially when you have massive contacts.
     * You MUST understand what exactly you are doing.
     */
    syncContact(): Promise<void>;
    /****************************************************************************
     * private section
     ***************************************************************************/
    private _findTagWithName;
    private _getTagList;
    private _getRoomMemberList;
    private _updateContactCache;
    private _updateRoomMember;
    private _onPushContact;
    private _onPushMessage;
    private _onSendMessage;
    private _setupClient;
    private _refreshContact;
    private _startPuppetHeart;
    private _stopPuppetHeart;
    private _getMessageImageFileBox;
}
export { PuppetPadlocal };
export default PuppetPadlocal;
//# sourceMappingURL=puppet-padlocal.d.ts.map