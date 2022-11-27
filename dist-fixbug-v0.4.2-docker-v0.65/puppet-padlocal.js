"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppetPadlocal = void 0;
const wechaty_puppet_1 = require("wechaty-puppet");
const padlocal_client_ts_1 = require("padlocal-client-ts");
const padlocal_pb_1 = require("padlocal-client-ts/dist/proto/padlocal_pb");
const Utils_1 = require("padlocal-client-ts/dist/utils/Utils");
const cache_manager_1 = require("./padlocal/cache-manager");
const is_type_1 = require("./padlocal/utils/is-type");
const schema_mapper_1 = require("./padlocal/schema-mapper");
const message_appmsg_1 = require("./padlocal/message-parser/helpers/message-appmsg");
const message_miniprogram_1 = require("./padlocal/message-parser/helpers/message-miniprogram");
const message_parser_1 = require("./padlocal/message-parser");
const message_parser_type_1 = require("./padlocal/message-parser/message-parser-type");
const XMLParser = __importStar(require("fast-xml-parser"));
const message_emotion_1 = require("./padlocal/message-parser/helpers/message-emotion");
const ByteUtils_1 = require("padlocal-client-ts/dist/utils/ByteUtils");
const cached_promise_1 = require("./padlocal/utils/cached-promise");
const SerialExecutor_1 = require("padlocal-client-ts/dist/utils/SerialExecutor");
const message_parser_room_leave_1 = require("./padlocal/message-parser/message-parser-room-leave");
const WechatMessageType_1 = require("./padlocal/message-parser/WechatMessageType");
const RetryStrategy_1 = require("padlocal-client-ts/dist/utils/RetryStrategy");
const url_1 = __importDefault(require("url"));
const cleanup_1 = require("./cleanup");
const PRE = "[PuppetPadlocal]";
const SEARCH_CONTACT_PREFIX = "$search$-";
const STRANGER_SUFFIX = "@stranger";
const logLevel = process.env.PADLOCAL_LOG || process.env.WECHATY_LOG;
if (logLevel) {
    wechaty_puppet_1.log.level(logLevel.toLowerCase());
    wechaty_puppet_1.log.silly(PRE, "set level to %s", logLevel);
}
else {
    // set default log level
    wechaty_puppet_1.log.level("info");
}
class PuppetPadlocal extends wechaty_puppet_1.Puppet {
    constructor(options = {}) {
        super(options);
        this.options = options;
        this._onPushSerialExecutor = new SerialExecutor_1.SerialExecutor();
        this._printVersion = true;
        this._restartStrategy = RetryStrategy_1.RetryStrategy.getStrategy(RetryStrategy_1.RetryStrategyRule.FAST, Number.MAX_SAFE_INTEGER);
        // try to fill token from env if not exits
        if (!this.options.token) {
            const token = process.env.WECHATY_PUPPET_PADLOCAL_TOKEN;
            if (!token) {
                wechaty_puppet_1.log.error("PuppetPadlocal", `

      WECHATY_PUPPET_PADLOCAL_TOKEN environment variable not found.

      PadLocal need a token before it can be used,
      Please set WECHATY_PUPPET_PADLOCAL_TOKEN then retry again.

    `);
                throw new Error("You need a valid WECHATY_PUPPET_PADLOCAL_TOKEN to use PuppetPadlocal");
            }
            this.options.token = token;
        }
        const endpoint = options.endpoint || process.env.WECHATY_PUPPET_PADLOCAL_ENDPOINT;
        if (endpoint) {
            process.env.PADLOCAL_ENDPOINT = endpoint;
        }
        const serverCAFilePath = options.serverCAFilePath || process.env.WECHATY_PUPPET_PADLOCAL_CA_FILE_PATH;
        if (serverCAFilePath) {
            process.env.PADLOCAL_CA_FILE_PATH = serverCAFilePath;
        }
    }
    get client() {
        return this._client;
    }
    async start() {
        await this._startClient(padlocal_pb_1.LoginPolicy.DEFAULT);
    }
    async _startClient(loginPolicy) {
        if (this.state.on()) {
            wechaty_puppet_1.log.warn(PRE, "start() is called on a ON puppet. await ready(on) and return.");
            await this.state.ready("on");
            return;
        }
        this._startPuppetHeart();
        this.state.on("pending");
        cleanup_1.addRunningPuppet(this);
        await this._setupClient();
        const ScanStatusName = {
            [wechaty_puppet_1.ScanStatus.Unknown]: "Unknown",
            [wechaty_puppet_1.ScanStatus.Cancel]: "Cancel",
            [wechaty_puppet_1.ScanStatus.Waiting]: "Waiting",
            [wechaty_puppet_1.ScanStatus.Scanned]: "Scanned",
            [wechaty_puppet_1.ScanStatus.Confirmed]: "Confirmed",
            [wechaty_puppet_1.ScanStatus.Timeout]: "Timeout",
        };
        const onQrCodeEvent = async (qrCodeEvent) => {
            let scanStatus = wechaty_puppet_1.ScanStatus.Unknown;
            let qrCodeImageURL;
            switch (qrCodeEvent.getStatus()) {
                case padlocal_pb_1.QRCodeStatus.NEW:
                    qrCodeImageURL = qrCodeEvent.getImageurl();
                    scanStatus = wechaty_puppet_1.ScanStatus.Waiting;
                    break;
                case padlocal_pb_1.QRCodeStatus.SCANNED:
                    scanStatus = wechaty_puppet_1.ScanStatus.Scanned;
                    break;
                case padlocal_pb_1.QRCodeStatus.CONFIRMED:
                    scanStatus = wechaty_puppet_1.ScanStatus.Confirmed;
                    break;
                case padlocal_pb_1.QRCodeStatus.CANCELLED:
                    scanStatus = wechaty_puppet_1.ScanStatus.Cancel;
                    break;
                case padlocal_pb_1.QRCodeStatus.EXPIRED:
                    scanStatus = wechaty_puppet_1.ScanStatus.Timeout;
                    break;
            }
            wechaty_puppet_1.log.silly(PRE, `scan event, status: ${ScanStatusName[scanStatus]}${qrCodeImageURL ? ", with qrcode: " + qrCodeImageURL : ""}`);
            this.emit("scan", {
                qrcode: qrCodeImageURL,
                status: scanStatus,
            });
        };
        const LoginTypeName = {
            [padlocal_pb_1.LoginType.QRLOGIN]: "QrLogin",
            [padlocal_pb_1.LoginType.AUTOLOGIN]: "AutoLogin",
            [padlocal_pb_1.LoginType.ONECLICKLOGIN]: "OneClickLogin",
        };
        if (loginPolicy === padlocal_pb_1.LoginPolicy.DEFAULT && this.options.defaultLoginPolicy !== undefined) {
            loginPolicy = this.options.defaultLoginPolicy;
        }
        this._client.api.login(loginPolicy, {
            onLoginStart: (loginType) => {
                wechaty_puppet_1.log.info(PRE, `start login with type: ${LoginTypeName[loginType]}`);
            },
            onOneClickEvent: onQrCodeEvent,
            onQrCodeEvent,
            onLoginSuccess: async (_) => {
                const userName = this._client.selfContact.getUsername();
                wechaty_puppet_1.log.silly(PRE, `login success: ${userName}`);
                await this.login(this._client.selfContact.getUsername());
            },
            // Will sync message and contact after login success, since last time login.
            onSync: async (syncEvent) => {
                wechaty_puppet_1.log.silly(PRE, `login sync event: ${JSON.stringify(syncEvent.toObject())}`);
                for (const contact of syncEvent.getContactList()) {
                    await this._onPushContact(contact);
                }
                for (const message of syncEvent.getMessageList()) {
                    await this._onPushMessage(message);
                }
            },
        })
            .then(() => {
            wechaty_puppet_1.log.silly(PRE, `on ready`);
            this.emit("ready", {
                data: "ready",
            });
            this.state.on(true);
        })
            .catch(async (_) => {
            await this._stopClient(true);
        });
    }
    /**
     * called internally while login success
     * @param userId
     * @protected
     */
    async login(userId) {
        this._restartStrategy.reset();
        // create cache manager firstly
        this._cacheMgr = new cache_manager_1.CacheManager(userId);
        await this._cacheMgr.init();
        await super.login(userId);
        const oldContact = await this._cacheMgr.getContact(this.id);
        if (!oldContact) {
            await this._updateContactCache(this._client.selfContact.toObject());
        }
    }
    /**
     * stop the bot, with account signed on, will try auto login next time bot start.
     */
    async stop() {
        await this._stopClient(false);
    }
    async _stopClient(restart) {
        if (this.state.off()) {
            wechaty_puppet_1.log.warn(PRE, "stop() is called on a OFF puppet. await ready(off) and return.");
            await this.state.ready("off");
            return;
        }
        this.state.off("pending");
        this._client.removeAllListeners();
        await this._client.shutdown();
        this._client = undefined;
        this.id = undefined;
        if (this._cacheMgr) {
            await this._cacheMgr.close();
            this._cacheMgr = undefined;
        }
        this.state.off(true);
        cleanup_1.removeRunningPuppet(this);
        this._stopPuppetHeart();
        if (restart && this._restartStrategy.canRetry()) {
            setTimeout(async () => {
                // one-click login after failure is strange, so skip it.
                await this._startClient(padlocal_pb_1.LoginPolicy.SKIP_ONE_CLICK);
            }, this._restartStrategy.nextRetryDelay());
        }
    }
    /**
     * logout account and stop the bot
     */
    async logout() {
        if (!this.id) {
            throw new Error("logout before login?");
        }
        await this._client.api.logout();
        this.emit("logout", { contactId: this.id, data: "logout by self" });
        await this._stopClient(true);
    }
    ding(_data) {
        this.emit("dong", { data: "Everything is ok" });
    }
    /****************************************************************************
     * contact
     ***************************************************************************/
    async contactSelfName(name) {
        await this._client.api.updateSelfNickName(name);
        this._client.selfContact.setNickname(name);
        const contact = await this.contactRawPayload(this._client.selfContact.getUsername());
        contact.nickname = name;
        await this._updateContactCache(contact);
    }
    async contactSelfQRCode() {
        const response = await this._client.api.getContactQRCode(this._client.selfContact.getUsername(), 1);
        const fileBox = wechaty_puppet_1.FileBox.fromBuffer(Buffer.from(response.getQrcode()), `qr-${this.id}.jpg`);
        return fileBox.toQRCode();
    }
    async contactSelfSignature(signature) {
        await this._client.api.updateSelfSignature(signature);
        this._client.selfContact.setSignature(signature);
        const contact = await this.contactRawPayload(this._client.selfContact.getUsername());
        contact.signature = signature;
        await this._updateContactCache(contact);
    }
    async contactAlias(contactId, alias) {
        var _a;
        const contact = await this.contactRawPayload(contactId);
        if (alias) {
            // contact is stranger, set alias in cache, to update after user is added
            if (contact.username.indexOf(STRANGER_SUFFIX) !== -1) {
                await this._cacheMgr.setContactStrangerAlias(contact.username, alias);
                // to suppress warning: 15:31:06 WARN Contact alias(asd3) sync with server fail: set(asd3) is not equal to get()
                if (contactId.startsWith(SEARCH_CONTACT_PREFIX)) {
                    const searchContact = await ((_a = this._cacheMgr) === null || _a === void 0 ? void 0 : _a.getContactSearch(contactId));
                    if (searchContact && searchContact.contact) {
                        searchContact.contact.remark = alias;
                        await this._cacheMgr.setContactSearch(contactId, searchContact);
                    }
                }
            }
            else {
                await this._client.api.updateContactRemark(contact.username, alias);
                contact.remark = alias;
                await this._updateContactCache(contact);
            }
        }
        else {
            return contact.remark;
        }
    }
    async contactAvatar(contactId, file) {
        if (file) {
            throw new Error(`set avatar is not unsupported`);
        }
        const contact = await this.contactRawPayload(contactId);
        return wechaty_puppet_1.FileBox.fromUrl(contact.avatar, `avatar-${contactId}.jpg`);
    }
    async contactList() {
        return this._cacheMgr.getContactIds();
    }
    contactCorporationRemark(contactId, corporationRemark) {
        throw new Error(`contactCorporationRemark(${contactId}, ${corporationRemark}) called failed: Method not supported.`);
    }
    contactDescription(contactId, description) {
        throw new Error(`contactDescription(${contactId}, ${description}) called failed: Method not supported.`);
    }
    contactPhone(contactId, phoneList) {
        throw new Error(`contactPhone(${contactId}, ${phoneList}) called failed: Method not supported.`);
    }
    async contactDelete(contactId) {
        const contact = await this._refreshContact(contactId);
        if (contact.getStranger()) {
            wechaty_puppet_1.log.warn(`can not delete contact which is not a friend:: ${contactId}`);
            return;
        }
        await this._client.api.deleteContact(contactId);
        await this._refreshContact(contactId);
    }
    /****************************************************************************
     * tag
     ***************************************************************************/
    async tagContactAdd(tagName, contactId) {
        const label = (await this._findTagWithName(tagName, true));
        const contact = await this.contactRawPayload(contactId);
        const contactLabelIds = contact.label
            .split(",")
            .filter((l) => l)
            .map((l) => parseInt(l, 10));
        if (contactLabelIds.indexOf(label.getId()) !== -1) {
            wechaty_puppet_1.log.warn(`contact: ${contactId} has already assigned tag: ${tagName}`);
            return;
        }
        contactLabelIds.push(label.getId());
        await this._client.api.setContactLabel(contactId, contactLabelIds);
        contact.label = contactLabelIds.join(",");
        await this._updateContactCache(contact);
    }
    async tagContactRemove(tagName, contactId) {
        const label = await this._findTagWithName(tagName);
        if (!label) {
            throw new Error(`can not find tag with name: ${tagName}`);
        }
        const contact = await this.contactRawPayload(contactId);
        const contactLabelIds = contact.label
            .split(",")
            .filter((l) => l)
            .map((l) => parseInt(l, 10));
        const labelIndex = contactLabelIds.indexOf(label.getId());
        if (labelIndex === -1) {
            wechaty_puppet_1.log.warn(PRE, `contact: ${contactId} has no tag: ${tagName}`);
            return;
        }
        contactLabelIds.splice(labelIndex, 1);
        await this._client.api.setContactLabel(contactId, contactLabelIds);
        contact.label = contactLabelIds.join(",");
        await this._updateContactCache(contact);
    }
    async tagContactDelete(tagName) {
        const label = (await this._findTagWithName(tagName, false));
        if (!label) {
            throw new Error(`tag:${tagName} doesn't exist`);
        }
        await this._client.api.removeLabel(label.getId());
        // refresh label list
        await this._getTagList(true);
    }
    async tagContactList(contactId) {
        // the all tag
        if (!contactId) {
            const { labelList } = await this._getTagList(true);
            return labelList.map((l) => l.getName());
        }
        else {
            const contact = await this.contactRawPayload(contactId);
            if (!contact.label || !contact.label.length) {
                return [];
            }
            const contactLabelIds = contact.label
                .split(",")
                .filter((l) => l)
                .map((l) => parseInt(l, 10));
            const { labelList, fromCache } = await this._getTagList();
            let contactLabelList = labelList.filter((l) => contactLabelIds.indexOf(l.getId()) !== -1);
            if (contactLabelList.length === contactLabelIds.length || !fromCache) {
                return contactLabelList.map((l) => l.getName());
            }
            // cached label list is out of date
            const newLabelList = (await this._getTagList(true)).labelList;
            contactLabelList = newLabelList.filter((l) => contactLabelIds.indexOf(l.getId()) !== -1);
            return contactLabelList.map((l) => l.getName());
        }
    }
    /****************************************************************************
     * friendship
     ***************************************************************************/
    async friendshipAccept(friendshipId) {
        const friendship = (await this.friendshipRawPayload(friendshipId));
        const userName = friendship.contactId;
        // FIXME: workaround to make accept enterprise account work. can be done in a better way
        if (is_type_1.isIMContactId(userName)) {
            await this._refreshContact(userName, friendship.ticket);
        }
        await this._client.api.acceptUser(userName, friendship.ticket, friendship.stranger, friendship.scene);
        // after adding friend, new version of contact will be pushed
    }
    async friendshipAdd(contactId, option) {
        let stranger;
        let ticket;
        let addContactScene;
        const cachedContactSearch = await this._cacheMgr.getContactSearch(contactId);
        if (cachedContactSearch) {
            stranger = cachedContactSearch.encryptusername;
            ticket = cachedContactSearch.antispamticket;
            addContactScene = cachedContactSearch.toaddscene;
        }
        else {
            const contactPayload = await this.contactRawPayload(contactId);
            let contactAlias = contactPayload.alias;
            if (!contactAlias) {
                // add contact from room,
                const roomIds = await this._findRoomIdForUserName(contactId);
                if (!roomIds.length) {
                    throw new Error(`Can not find room for contact while adding friendship: ${contactId}`);
                }
                const roomId = roomIds[0];
                const contact = await this._client.api.getChatRoomMember(roomId, contactId);
                await this._updateContactCache(contact.toObject());
                contactAlias = contact.getAlias();
            }
            const res = await this._client.api.searchContact(contactAlias);
            if (!res.getAntispamticket()) {
                throw new Error(`contact:${contactId} is already a friend`);
            }
            stranger = res.getEncryptusername();
            ticket = res.getAntispamticket();
            addContactScene = res.getToaddscene();
        }
        if (stranger.indexOf(STRANGER_SUFFIX) === -1 || !ticket) {
            // the contact is already a friend
            wechaty_puppet_1.log.warn(`contact: ${stranger} is already a friend, skip adding`);
        }
        else {
            let hello;
            let roomId;
            let cid;
            if (option) {
                if (typeof option === "string") {
                    hello = option;
                }
                else {
                    hello = option.hello;
                    roomId = option.roomId;
                    cid = option.contactId;
                }
            }
            await this._client.api.addContact(stranger, ticket, addContactScene, hello, roomId, cid);
        }
    }
    async friendshipSearchPhone(phone) {
        return this._friendshipSearch(phone);
    }
    async friendshipSearchWeixin(weixin) {
        return this._friendshipSearch(weixin);
    }
    async _friendshipSearch(id) {
        const cachedContactSearch = await this._cacheMgr.getContactSearch(id);
        if (cachedContactSearch) {
            return id;
        }
        const res = await this._client.api.searchContact(id);
        const searchId = `${SEARCH_CONTACT_PREFIX}${id}`;
        await this._cacheMgr.setContactSearch(searchId, res.toObject());
        return searchId;
    }
    async _findRoomIdForUserName(userName) {
        var _a, _b;
        const ret = [];
        const roomIds = (await ((_a = this._cacheMgr) === null || _a === void 0 ? void 0 : _a.getRoomIds())) || [];
        for (const roomId of roomIds) {
            const roomMember = await ((_b = this._cacheMgr) === null || _b === void 0 ? void 0 : _b.getRoomMember(roomId));
            if (!roomMember) {
                continue;
            }
            const roomMemberIds = Object.keys(roomMember);
            if (roomMemberIds.indexOf(userName) !== -1) {
                ret.push(roomId);
            }
        }
        return ret;
    }
    /****************************************************************************
     * get message payload
     ***************************************************************************/
    async messageContact(_messageId) {
        throw new Error(`not implement`);
    }
    async messageFile(messageId) {
        const messagePayload = await this.messageRawPayload(messageId);
        const message = await this.messageRawPayloadParser(messagePayload);
        switch (message.type) {
            case wechaty_puppet_1.MessageType.Image:
                return this._getMessageImageFileBox(messageId, messagePayload, wechaty_puppet_1.ImageType.HD);
            case wechaty_puppet_1.MessageType.Audio:
                let audioData;
                if (messagePayload.binarypayload && messagePayload.binarypayload.length) {
                    // json marshalled binary into base64 string
                    if (typeof messagePayload.binarypayload === "string") {
                        audioData = Buffer.from(messagePayload.binarypayload, "base64");
                    }
                    else {
                        audioData = Buffer.from(messagePayload.binarypayload);
                    }
                }
                else {
                    audioData = await this._client.api.getMessageVoice(messageId, message.text, messagePayload.tousername);
                }
                const audioFileBox = wechaty_puppet_1.FileBox.fromBuffer(audioData, `message-${messageId}-audio.slk`);
                audioFileBox.mimeType = "audio/silk";
                const options = {
                    attributeNamePrefix: "",
                    attrNodeName: "$",
                    ignoreAttributes: false,
                };
                const msgXmlObj = XMLParser.parse(messagePayload.content, options);
                const voiceLength = parseInt(msgXmlObj.msg.voicemsg.$.voicelength, 10);
                audioFileBox.metadata = {
                    voiceLength,
                };
                return audioFileBox;
            case wechaty_puppet_1.MessageType.Video:
                const videoData = await this._client.api.getMessageVideo(message.text, messagePayload.tousername);
                const videoFileBox = wechaty_puppet_1.FileBox.fromBuffer(videoData, `message-${messageId}-video.mp4`);
                videoFileBox.mimeType = "video/mp4";
                return videoFileBox;
            case wechaty_puppet_1.MessageType.Attachment:
                const appMsg = await message_appmsg_1.appMessageParser(messagePayload);
                const fileData = await this._client.api.getMessageAttach(message.text, messagePayload.tousername);
                const binaryFileBox = wechaty_puppet_1.FileBox.fromBuffer(fileData, appMsg.title);
                binaryFileBox.mimeType = "application/octet-stream";
                return binaryFileBox;
            case wechaty_puppet_1.MessageType.Emoticon:
                const emotionPayload = await message_emotion_1.emotionPayloadParser(messagePayload);
                const emoticonBox = wechaty_puppet_1.FileBox.fromUrl(emotionPayload.cdnurl, `message-${messageId}-emotion.jpg`);
                emoticonBox.metadata = emotionPayload;
                emoticonBox.mimeType = "emoticon";
                return emoticonBox;
            case wechaty_puppet_1.MessageType.MiniProgram:
                const thumbData = await this._client.api.getMessageMiniProgramThumb(messagePayload.content, messagePayload.tousername);
                return wechaty_puppet_1.FileBox.fromBuffer(thumbData, `message-${messageId}-miniprogram-thumb.jpg`);
            case wechaty_puppet_1.MessageType.Url:
                const appPayload = await message_appmsg_1.appMessageParser(messagePayload);
                if (appPayload.thumburl) {
                    return wechaty_puppet_1.FileBox.fromUrl(appPayload.thumburl);
                }
                else {
                    const urlThumbData = await this._client.api.getMessageAttachThumb(messagePayload.content, messagePayload.tousername);
                    return wechaty_puppet_1.FileBox.fromBuffer(urlThumbData, `message-${messageId}-url-thumb.jpg`);
                }
            default:
                throw new Error(`Can not get file for message: ${messageId}`);
        }
    }
    async messageImage(messageId, imageType) {
        const messagePayload = await this.messageRawPayload(messageId);
        return this._getMessageImageFileBox(messageId, messagePayload, imageType);
    }
    async messageMiniProgram(messageId) {
        const messagePayload = await this.messageRawPayload(messageId);
        const message = await this.messageRawPayloadParser(messagePayload);
        if (message.type !== wechaty_puppet_1.MessageType.MiniProgram) {
            throw new Error(`message is not mini program, can not get MiniProgramPayload`);
        }
        return message_miniprogram_1.miniProgramMessageParser(messagePayload);
    }
    async messageUrl(messageId) {
        const rawPayload = await this.messageRawPayload(messageId);
        const payload = await this.messageRawPayloadParser(rawPayload);
        if (payload.type !== wechaty_puppet_1.MessageType.Url) {
            throw new Error("Can not get url from non url payload");
        }
        // FIXME: thumb may not in appPayload.thumburl, but in appPayload.appAttachPayload
        const appPayload = await message_appmsg_1.appMessageParser(rawPayload);
        return {
            description: appPayload.des,
            thumbnailUrl: appPayload.thumburl,
            title: appPayload.title,
            url: appPayload.url,
        };
    }
    /****************************************************************************
     * send message
     ***************************************************************************/
    async messageSendContact(toUserName, contactId) {
        const contactPayload = await this.contactRawPayload(contactId);
        const contact = new padlocal_pb_1.Contact()
            .setUsername(contactPayload.username)
            .setNickname(contactPayload.nickname)
            .setAvatar(contactPayload.avatar)
            .setGender(contactPayload.gender)
            .setSignature(contactPayload.signature)
            .setAlias(contactPayload.alias)
            .setLabel(contactPayload.label)
            .setRemark(contactPayload.remark)
            .setCity(contactPayload.city)
            .setProvince(contactPayload.province)
            .setCountry(contactPayload.country)
            .setContactaddscene(contactPayload.contactaddscene)
            .setStranger(contactPayload.stranger);
        const response = await this._client.api.sendContactCardMessage(Utils_1.genIdempotentId(), toUserName, contact);
        const pushContent = (is_type_1.isRoomId(toUserName) ? `${this._client.selfContact.getNickname()}: ` : "") +
            "向你推荐了" +
            contact.getNickname();
        await this._onSendMessage(new padlocal_pb_1.Message()
            .setType(WechatMessageType_1.WechatMessageType.Text) // FIXME: difficult to construct a legal Contact message, use text instead.
            .setFromusername(this.id)
            .setTousername(toUserName)
            .setContent(pushContent)
            .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
        return response.getMsgid();
    }
    async messageSendFile(toUserName, fileBox) {
        var _a, _b;
        // image/jpeg, image/png
        if ((_a = fileBox.mimeType) === null || _a === void 0 ? void 0 : _a.startsWith("image/")) {
            const imageData = await fileBox.toBuffer();
            const response = await this._client.api.sendImageMessage(Utils_1.genIdempotentId(), toUserName, imageData);
            const pushContent = is_type_1.isRoomId(toUserName) ? `${this._client.selfContact.getNickname()}: [图片]` : "[图片]";
            await this._onSendMessage(new padlocal_pb_1.Message()
                .setType(WechatMessageType_1.WechatMessageType.Text) // FIXME: difficult to construct a legal Image message, use text instead.
                .setFromusername(this.id)
                .setTousername(toUserName)
                .setContent(pushContent)
                .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
            return response.getMsgid();
        }
        // audio/silk
        else if (fileBox.mimeType === "audio/silk") {
            const audioData = await fileBox.toBuffer();
            const response = await this._client.api.sendVoiceMessage(Utils_1.genIdempotentId(), toUserName, audioData, fileBox.metadata.voiceLength);
            const pushContent = is_type_1.isRoomId(toUserName) ? `${this._client.selfContact.getNickname()}: [语音]` : "[语音]";
            await this._onSendMessage(new padlocal_pb_1.Message()
                .setType(WechatMessageType_1.WechatMessageType.Text) // FIXME: difficult to construct a legal Voice message, use text instead.
                .setFromusername(this.id)
                .setTousername(toUserName)
                .setContent(pushContent)
                .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
            return response.getMsgid();
        }
        // video/mp4
        else if ((_b = fileBox.mimeType) === null || _b === void 0 ? void 0 : _b.startsWith("video/")) {
            const videoData = await fileBox.toBuffer();
            const response = await this._client.api.sendVideoMessage(Utils_1.genIdempotentId(), toUserName, videoData);
            const pushContent = is_type_1.isRoomId(toUserName) ? `${this._client.selfContact.getNickname()}: [视频]` : "[视频]";
            await this._onSendMessage(new padlocal_pb_1.Message()
                .setType(WechatMessageType_1.WechatMessageType.Text) // FIXME: difficult to construct a legal Video message, use text instead.
                .setFromusername(this.id)
                .setTousername(toUserName)
                .setContent(pushContent)
                .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
            return response.getMsgid();
        }
        // emotion
        else if (fileBox.mimeType === "emoticon") {
            const emotionPayload = fileBox.metadata;
            const response = await this._client.api.sendMessageEmoji(Utils_1.genIdempotentId(), toUserName, emotionPayload.md5, emotionPayload.len, emotionPayload.type, emotionPayload.gameext);
            const pushContent = is_type_1.isRoomId(toUserName)
                ? `${this._client.selfContact.getNickname()}: [动画表情]`
                : "[动画表情]";
            const content = message_emotion_1.emotionPayloadGenerator(emotionPayload);
            await this._onSendMessage(new padlocal_pb_1.Message()
                .setType(WechatMessageType_1.WechatMessageType.Emoticon)
                .setFromusername(this.id)
                .setTousername(toUserName)
                .setContent(content)
                .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
            return response.getMsgid();
        }
        // try to send any other type as binary fileBox
        // application/octet-stream
        else {
            const fileData = await fileBox.toBuffer();
            const response = await this._client.api.sendFileMessage(Utils_1.genIdempotentId(), toUserName, fileData, fileBox.name);
            const pushContent = is_type_1.isRoomId(toUserName) ? `${this._client.selfContact.getNickname()}: [文件]` : "[文件]";
            await this._onSendMessage(new padlocal_pb_1.Message()
                .setType(WechatMessageType_1.WechatMessageType.Text) // FIXME: difficult to construct a legal File message, use text instead.
                .setFromusername(this.id)
                .setTousername(toUserName)
                .setContent(pushContent)
                .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
            return response.getMsgid();
        }
    }
    async messageSendMiniProgram(toUserName, mpPayload) {
        const miniProgram = new padlocal_pb_1.AppMessageMiniProgram();
        mpPayload.appid && miniProgram.setMpappid(mpPayload.appid);
        mpPayload.title && miniProgram.setTitle(mpPayload.title);
        mpPayload.pagePath && miniProgram.setMpapppath(mpPayload.pagePath);
        mpPayload.iconUrl && miniProgram.setMpappiconurl(mpPayload.iconUrl);
        mpPayload.description && miniProgram.setDescription(mpPayload.description);
        mpPayload.description && miniProgram.setMpappname(mpPayload.description);
        mpPayload.username && miniProgram.setMpappusername(mpPayload.username);
        let thumbImageData = null;
        // 1. cdn url and key
        if (mpPayload.thumbUrl && mpPayload.thumbKey) {
            thumbImageData = await this._client.api.getEncryptedFile(padlocal_pb_1.EncryptedFileType.IMAGE_THUMB, mpPayload.thumbUrl, ByteUtils_1.hexStringToBytes(mpPayload.thumbKey));
        }
        // 2. http url
        else if (mpPayload.thumbUrl) {
            const parsedUrl = new url_1.default.URL(mpPayload.thumbUrl);
            if (parsedUrl.protocol.startsWith("http")) {
                // download the image data
                const imageBox = wechaty_puppet_1.FileBox.fromUrl(mpPayload.thumbUrl);
                thumbImageData = await imageBox.toBuffer();
            }
        }
        if (!thumbImageData) {
            wechaty_puppet_1.log.warn(PRE, "no thumb image found while sending mimi program");
        }
        const response = await this._client.api.sendMessageMiniProgram(Utils_1.genIdempotentId(), toUserName, miniProgram, thumbImageData);
        const pushContent = is_type_1.isRoomId(toUserName)
            ? `${this._client.selfContact.getNickname()}: [小程序] ${mpPayload.title}`
            : `[小程序] ${mpPayload.title}`;
        await this._onSendMessage(new padlocal_pb_1.Message()
            .setType(WechatMessageType_1.WechatMessageType.App)
            .setFromusername(this.id)
            .setTousername(toUserName)
            .setContent(response.getMsgcontent())
            .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
        return response.getMsgid();
    }
    async messageSendText(toUserName, text, mentionIdList) {
        const response = await this._client.api.sendTextMessage(Utils_1.genIdempotentId(), toUserName, text, mentionIdList);
        const pushContent = is_type_1.isRoomId(toUserName) ? `${this._client.selfContact.getNickname()}: ${text}` : text;
        await this._onSendMessage(new padlocal_pb_1.Message()
            .setType(WechatMessageType_1.WechatMessageType.Text)
            .setFromusername(this.id)
            .setTousername(toUserName)
            .setContent(text)
            .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
        return response.getMsgid();
    }
    async messageSendUrl(toUserName, linkPayload) {
        const appMessageLink = new padlocal_pb_1.AppMessageLink();
        appMessageLink.setTitle(linkPayload.title).setUrl(linkPayload.url);
        linkPayload.description && appMessageLink.setDescription(linkPayload.description);
        if (linkPayload.thumbnailUrl) {
            appMessageLink.setThumburl(linkPayload.thumbnailUrl);
        }
        const response = await this._client.api.sendMessageLink(Utils_1.genIdempotentId(), toUserName, appMessageLink);
        const pushContent = is_type_1.isRoomId(toUserName)
            ? `${this._client.selfContact.getNickname()}: [链接] ${linkPayload.title}`
            : `[链接] ${linkPayload.title}`;
        await this._onSendMessage(new padlocal_pb_1.Message()
            .setType(WechatMessageType_1.WechatMessageType.App)
            .setFromusername(this.id)
            .setTousername(toUserName)
            .setContent(response.getMsgcontent())
            .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
        return response.getMsgid();
    }
    async messageRecall(messageId) {
        const message = (await this._cacheMgr.getMessage(messageId));
        const messageRevokeInfo = (await this._cacheMgr.getMessageRevokeInfo(messageId));
        await this._client.api.revokeMessage(messageId, message.fromusername, message.tousername, new padlocal_pb_1.MessageRevokeInfo()
            .setClientmsgid(messageRevokeInfo.clientmsgid)
            .setNewclientmsgid(messageRevokeInfo.newclientmsgid)
            .setCreatetime(messageRevokeInfo.createtime));
        return true;
    }
    async messageForward(toUserName, messageId) {
        const messagePayload = await this.messageRawPayload(messageId);
        const message = await this.messageRawPayloadParser(messagePayload);
        let newMessageId;
        switch (message.type) {
            case wechaty_puppet_1.MessageType.Text:
                newMessageId = await this.messageSendText(toUserName, message.text);
                break;
            case wechaty_puppet_1.MessageType.Image:
                const imageFileBox = await this.messageImage(messageId, wechaty_puppet_1.ImageType.HD);
                newMessageId = await this.messageSendFile(toUserName, imageFileBox);
                break;
            case wechaty_puppet_1.MessageType.Audio:
                const audioFileBox = await this.messageFile(messageId);
                newMessageId = await this.messageSendFile(toUserName, audioFileBox);
                break;
            case wechaty_puppet_1.MessageType.Video:
                const videoFileBox = await this.messageFile(messageId);
                newMessageId = await this.messageSendFile(toUserName, videoFileBox);
                break;
            case wechaty_puppet_1.MessageType.Attachment:
            case wechaty_puppet_1.MessageType.MiniProgram:
            case wechaty_puppet_1.MessageType.Url:
                const response = await this._client.api.forwardMessage(Utils_1.genIdempotentId(), toUserName, messagePayload.content, messagePayload.type, messagePayload.tousername);
                newMessageId = response.getMsgid();
                let pushContent = messagePayload.pushcontent;
                if (pushContent && pushContent.indexOf(":") !== -1) {
                    pushContent = pushContent.split(":")[1];
                }
                if (is_type_1.isRoomId(toUserName)) {
                    pushContent = `${this._client.selfContact.getNickname()}:${pushContent}`;
                }
                await this._onSendMessage(new padlocal_pb_1.Message()
                    .setType(WechatMessageType_1.WechatMessageType.App)
                    .setFromusername(this.id)
                    .setTousername(toUserName)
                    .setContent(response.getMsgcontent())
                    .setPushcontent(pushContent), response.getMsgid(), response.getMessagerevokeinfo());
                break;
            case wechaty_puppet_1.MessageType.Emoticon:
                const emotionBox = await this.messageFile(messageId);
                newMessageId = await this.messageSendFile(toUserName, emotionBox);
                break;
            default:
                throw new Error(`Message forwarding is unsupported for messageId:${messageId}, type:${message.type}`);
        }
        return newMessageId;
    }
    /****************************************************************************
     * room
     ***************************************************************************/
    async roomAdd(roomId, contactId) {
        await this._client.api.addChatRoomMember(roomId, contactId);
    }
    async roomAvatar(roomId) {
        const chatroom = await this.roomRawPayload(roomId);
        return wechaty_puppet_1.FileBox.fromUrl(chatroom.avatar || "");
    }
    async roomCreate(contactIdList, topic) {
        const res = await this._client.api.createChatRoom(Utils_1.genIdempotentId(), contactIdList);
        if (topic) {
            await this._client.api.setChatRoomName(res.getRoomid(), topic);
        }
        return res.getRoomid();
    }
    async roomDel(roomId, contactId) {
        await this._client.api.deleteChatRoomMember(roomId, contactId);
    }
    async roomList() {
        return this._cacheMgr.getRoomIds();
    }
    async roomQRCode(roomId) {
        const res = await this._client.api.getChatRoomQrCode(roomId);
        const fileBox = wechaty_puppet_1.FileBox.fromBuffer(Buffer.from(res.getQrcode()), `qr-${this.id}.jpg`);
        return fileBox.toQRCode();
    }
    async roomQuit(roomId) {
        await this._client.api.quitChatRoom(roomId);
    }
    async roomTopic(roomId, topic) {
        await this._client.api.setChatRoomName(roomId, topic || "");
    }
    async roomAnnounce(roomId, text) {
        if (text === undefined) {
            return this._client.api.getChatRoomAnnouncement(roomId);
        }
        else {
            await this._client.api.setChatRoomAnnouncement(roomId, text);
        }
    }
    async roomMemberList(roomId) {
        const roomMemberMap = await this._getRoomMemberList(roomId);
        return Object.values(roomMemberMap).map((m) => m.username);
    }
    async roomInvitationAccept(roomInvitationId) {
        const roomInvitation = await this.roomInvitationRawPayload(roomInvitationId);
        await this._client.api.acceptChatRoomInvitation(roomInvitation.inviterId, roomInvitation.invitation);
    }
    /****************************************************************************
     * RawPayload section
     ***************************************************************************/
    async contactRawPayloadParser(payload) {
        return schema_mapper_1.padLocalContactToWechaty(payload);
    }
    async contactRawPayload(id) {
        var _a;
        if (id.startsWith(SEARCH_CONTACT_PREFIX)) {
            const searchContact = await ((_a = this._cacheMgr) === null || _a === void 0 ? void 0 : _a.getContactSearch(id));
            return searchContact.contact;
        }
        let ret = await this._cacheMgr.getContact(id);
        if (!ret) {
            ret = await cached_promise_1.CachedPromiseFunc(`contactRawPayload-${id}`, async () => {
                const contact = await this._refreshContact(id);
                return contact.toObject();
            });
        }
        return ret;
    }
    async messageRawPayloadParser(payload) {
        return schema_mapper_1.padLocalMessageToWechaty(this, payload);
    }
    async messageRawPayload(id) {
        const ret = await this._cacheMgr.getMessage(id);
        if (!ret) {
            throw new Error(`can not find message in cache for messageId: ${id}`);
        }
        return ret;
    }
    async roomRawPayloadParser(payload) {
        return schema_mapper_1.padLocalRoomToWechaty(payload);
    }
    async roomRawPayload(id) {
        let ret = await this._cacheMgr.getRoom(id);
        if (!ret) {
            const contact = await this._refreshContact(id);
            ret = contact.toObject();
        }
        return ret;
    }
    async roomMemberRawPayload(roomId, contactId) {
        const roomMemberMap = await this._getRoomMemberList(roomId);
        return roomMemberMap[contactId];
    }
    async roomMemberRawPayloadParser(rawPayload) {
        return schema_mapper_1.padLocalRoomMemberToWechaty(rawPayload);
    }
    async roomInvitationRawPayload(roomInvitationId) {
        const ret = await this._cacheMgr.getRoomInvitation(roomInvitationId);
        if (!ret) {
            throw new Error(`Can not find room invitation for id: ${roomInvitationId}`);
        }
        return ret;
    }
    async roomInvitationRawPayloadParser(rawPayload) {
        return rawPayload;
    }
    async friendshipRawPayload(id) {
        const ret = await this._cacheMgr.getFriendshipRawPayload(id);
        if (!ret) {
            throw new Error(`Can not find friendship for id: ${id}`);
        }
        return ret;
    }
    async friendshipRawPayloadParser(rawPayload) {
        return rawPayload;
    }
    /****************************************************************************
     * extra methods section
     ***************************************************************************/
    /**
     * CAUTION: For edge case usage only!
     * Sync contact is a time consuming action, may last for minutes especially when you have massive contacts.
     * You MUST understand what exactly you are doing.
     */
    async syncContact() {
        if (this.state.on() !== true) {
            throw new Error("Can not sync contact before login");
        }
        await this.client.api.syncContact({
            onSync: (contactList) => {
                this._onPushSerialExecutor.execute(async () => {
                    for (const contact of contactList) {
                        await this._onPushContact(contact);
                    }
                });
            },
        });
    }
    /****************************************************************************
     * private section
     ***************************************************************************/
    async _findTagWithName(tagName, addIfNotExist) {
        let labelList = (await this._getTagList()).labelList;
        let ret = labelList.find((l) => l.getName() === tagName);
        if (!ret) {
            // try refresh label list if not find by name
            labelList = (await this._getTagList(true)).labelList;
            ret = labelList.find((l) => l.getName() === tagName);
        }
        // add new label
        if (!ret && addIfNotExist) {
            const newLabelId = await this._client.api.addLabel(tagName);
            ret = new padlocal_pb_1.Label().setId(newLabelId).setName(tagName);
            // refresh label list;
            await this._getTagList(true);
        }
        return ret || null;
    }
    async _getTagList(force) {
        var _a;
        let labelList = this._cacheMgr.getLabelList();
        let fromCache = true;
        if (!labelList || force) {
            labelList = await this._client.api.getLabelList();
            (_a = this._cacheMgr) === null || _a === void 0 ? void 0 : _a.setLabelList(labelList);
            fromCache = false;
        }
        return {
            labelList,
            fromCache,
        };
    }
    async _getRoomMemberList(roomId, force) {
        let ret = await this._cacheMgr.getRoomMember(roomId);
        if (!ret || force) {
            const resMembers = await this._client.api.getChatRoomMembers(roomId);
            const roomMemberMap = {};
            for (const roomMember of resMembers) {
                const contact = schema_mapper_1.chatRoomMemberToContact(roomMember);
                const hasContact = await this._cacheMgr.hasContact(contact.getUsername());
                // save chat room member as contact, to forbid massive this._client.api.getContact(id) requests while room.ready()
                if (!hasContact) {
                    await this._cacheMgr.setContact(contact.getUsername(), contact.toObject());
                }
                roomMemberMap[roomMember.getUsername()] = roomMember.toObject();
            }
            ret = roomMemberMap;
            await this._updateRoomMember(roomId, roomMemberMap);
        }
        return ret;
    }
    async _updateContactCache(contact) {
        if (!contact.username) {
            wechaty_puppet_1.log.warn(PRE, `username is required for contact: ${JSON.stringify(contact)}`);
            return;
        }
        if (is_type_1.isRoomId(contact.username)) {
            const oldRoomPayload = await this._cacheMgr.getRoom(contact.username);
            if (oldRoomPayload) {
                // some contact push may not contain avatar, e.g. modify room announcement
                if (!contact.avatar) {
                    contact.avatar = oldRoomPayload.avatar;
                }
                // If case you are not the chatroom owner, room leave message will not be sent.
                // Calc the room member diffs, then send room leave event instead.
                if (contact.chatroommemberList.length < oldRoomPayload.chatroommemberList.length) {
                    const newMemberIdSet = new Set(contact.chatroommemberList.map((m) => m.username));
                    const removedMemberIdList = oldRoomPayload.chatroommemberList
                        .filter((m) => !newMemberIdSet.has(m.username))
                        .map((m) => m.username)
                        .filter((removeeId) => !message_parser_room_leave_1.isRoomLeaveDebouncing(contact.username, removeeId));
                    if (removedMemberIdList.length) {
                        removedMemberIdList.forEach((removeeId) => {
                            const roomLeave = {
                                removeeIdList: [removeeId],
                                removerId: removeeId,
                                roomId: contact.username,
                                timestamp: Math.floor(Date.now() / 1000),
                            };
                            this.emit("room-leave", roomLeave);
                        });
                    }
                }
            }
            const roomId = contact.username;
            await this._cacheMgr.setRoom(roomId, contact);
            await this.dirtyPayload(wechaty_puppet_1.PayloadType.Room, roomId);
            await this._updateRoomMember(roomId);
        }
        else {
            await this._cacheMgr.setContact(contact.username, contact);
            await this.dirtyPayload(wechaty_puppet_1.PayloadType.Contact, contact.username);
        }
    }
    async _updateRoomMember(roomId, roomMemberMap) {
        if (roomMemberMap) {
            await this._cacheMgr.setRoomMember(roomId, roomMemberMap);
        }
        else {
            await this._cacheMgr.deleteRoomMember(roomId);
        }
        await this.dirtyPayload(wechaty_puppet_1.PayloadType.RoomMember, roomId);
    }
    async _onPushContact(contact) {
        wechaty_puppet_1.log.silly(PRE, `on push contact: ${JSON.stringify(contact.toObject())}`);
        await this._updateContactCache(contact.toObject());
        if (contact.getEncryptusername()) {
            const aliasToSet = await this._cacheMgr.getContactStrangerAlias(contact.getEncryptusername());
            if (aliasToSet) {
                await this.contactAlias(contact.getUsername(), aliasToSet);
                await this._cacheMgr.deleteContactStrangerAlias(contact.getEncryptusername());
            }
        }
    }
    async _onPushMessage(message) {
        const messageId = message.getId();
        wechaty_puppet_1.log.silly(PRE, `on push original message: ${JSON.stringify(message.toObject())}`);
        wechaty_puppet_1.log.silly(PRE, Buffer.from(message.serializeBinary()).toString("hex"));
        // filter out duplicated messages
        if (await this._cacheMgr.hasMessage(messageId)) {
            return;
        }
        const messageObj = message.toObject();
        await this._cacheMgr.setMessage(message.getId(), messageObj);
        const parseRet = await message_parser_1.parseMessage(this, messageObj);
        switch (parseRet.category) {
            case message_parser_type_1.MessageCategory.NormalMessage:
                this.emit("message", {
                    messageId,
                });
                break;
            case message_parser_type_1.MessageCategory.Friendship:
                const friendship = parseRet.payload;
                await this._cacheMgr.setFriendshipRawPayload(messageId, friendship);
                this.emit("friendship", {
                    friendshipId: messageId,
                });
                break;
            case message_parser_type_1.MessageCategory.RoomInvite:
                const roomInvite = parseRet.payload;
                await this._cacheMgr.setRoomInvitation(messageId, roomInvite);
                this.emit("room-invite", {
                    roomInvitationId: messageId,
                });
                break;
            case message_parser_type_1.MessageCategory.RoomJoin:
                const roomJoin = parseRet.payload;
                this.emit("room-join", roomJoin);
                await this._updateRoomMember(roomJoin.roomId);
                break;
            case message_parser_type_1.MessageCategory.RoomLeave:
                const roomLeave = parseRet.payload;
                this.emit("room-leave", roomLeave);
                await this._updateRoomMember(roomLeave.roomId);
                break;
            case message_parser_type_1.MessageCategory.RoomTopic:
                const roomTopic = parseRet.payload;
                this.emit("room-topic", roomTopic);
        }
    }
    async _onSendMessage(partialMessage, messageId, messageRevokeInfo) {
        partialMessage.setId(messageId);
        partialMessage.setCreatetime(messageRevokeInfo.getCreatetime());
        await this._cacheMgr.setMessage(messageId, partialMessage.toObject());
        await this._cacheMgr.setMessageRevokeInfo(messageId, messageRevokeInfo.toObject());
    }
    async _setupClient() {
        this._client = await padlocal_client_ts_1.PadLocalClient.create(this.options.token, true);
        this._client.on("kickout", async (_detail) => {
            if (this.id) {
                this.emit("logout", { contactId: this.id, data: _detail.errorMessage });
            }
            await this._stopClient(true);
        });
        this._client.on("message", async (messageList) => {
            await this._onPushSerialExecutor.execute(async () => {
                for (const message of messageList) {
                    // handle message one by one
                    await this._onPushMessage(message);
                }
            });
        });
        this._client.on("contact", async (contactList) => {
            await this._onPushSerialExecutor.execute(async () => {
                for (const contact of contactList) {
                    await this._onPushContact(contact);
                }
            });
        });
        if (this._printVersion) {
            // only print once
            this._printVersion = false;
            wechaty_puppet_1.log.info(`
      ============================================================
       Welcome to Wechaty PadLocal puppet!

       - wechaty-puppet-padlocal version: ${this.version()}
       - padlocal-ts-client version: ${this._client.version}
      ============================================================
    `);
        }
    }
    async _refreshContact(userName, ticket) {
        const contact = await this._client.api.getContact(userName, ticket);
        // may return contact with empty payload, empty username, nickname, etc.
        if (!contact.getUsername()) {
            contact.setUsername(userName);
        }
        await this._updateContactCache(contact.toObject());
        return contact;
    }
    _startPuppetHeart(firstTime = true) {
        if (firstTime && this._heartBeatTimer) {
            return;
        }
        this.emit("heartbeat", { data: "heartbeat@padlocal" });
        this._heartBeatTimer = global.setTimeout(() => {
            this._startPuppetHeart(false);
        }, 15 * 1000); // 15s
    }
    _stopPuppetHeart() {
        if (!this._heartBeatTimer) {
            return;
        }
        clearTimeout(this._heartBeatTimer);
        this._heartBeatTimer = undefined;
    }
    async _getMessageImageFileBox(messageId, messagePayload, imageType) {
        const message = await this.messageRawPayloadParser(messagePayload);
        if (message.type !== wechaty_puppet_1.MessageType.Image) {
            throw new Error(`message ${messageId} is not image type message`);
        }
        if (imageType === wechaty_puppet_1.ImageType.Thumbnail) {
            if (messagePayload.binarypayload && messagePayload.binarypayload.length) {
                const imageData = Buffer.from(messagePayload.binarypayload);
                return wechaty_puppet_1.FileBox.fromBuffer(imageData, `message-${messageId}-image-thumb.jpg`);
            }
        }
        let pbImageType;
        if (imageType === wechaty_puppet_1.ImageType.Thumbnail) {
            pbImageType = padlocal_pb_1.ImageType.THUMB;
        }
        else if (imageType === wechaty_puppet_1.ImageType.HD) {
            pbImageType = padlocal_pb_1.ImageType.NORMAL;
        }
        else {
            pbImageType = padlocal_pb_1.ImageType.HD;
        }
        const ret = await this._client.api.getMessageImage(messagePayload.content, messagePayload.tousername, pbImageType);
        let imageNameSuffix;
        if (ret.imageType === padlocal_pb_1.ImageType.THUMB) {
            imageNameSuffix = "thumb";
        }
        else if (ret.imageType === padlocal_pb_1.ImageType.HD) {
            imageNameSuffix = "hd";
        }
        else {
            imageNameSuffix = "normal";
        }
        return wechaty_puppet_1.FileBox.fromBuffer(ret.imageData, `message-${messageId}-image-${imageNameSuffix}.jpg`);
    }
}
exports.PuppetPadlocal = PuppetPadlocal;
exports.default = PuppetPadlocal;
//# sourceMappingURL=puppet-padlocal.js.map