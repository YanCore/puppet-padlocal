"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoomMemberToContact = exports.padLocalRoomMemberToWechaty = exports.padLocalRoomToWechaty = exports.padLocalContactToWechaty = exports.padLocalMessageToWechaty = void 0;
const padlocal_pb_1 = require("padlocal-client-ts/dist/proto/padlocal_pb");
const wechaty_puppet_1 = require("wechaty-puppet");
const is_type_1 = require("../utils/is-type");
const message_1 = require("../message-parser/helpers/message");
const message_appmsg_1 = require("../message-parser/helpers/message-appmsg");
const message_pat_1 = require("../message-parser/helpers/message-pat");
const PRE = "[SchemaMapper]";
async function padLocalMessageToWechaty(puppet, message) {
    const wechatMessageType = message.type;
    const type = message_1.convertMessageType(wechatMessageType);
    const payloadBase = {
        id: message.id,
        timestamp: message.createtime,
        type,
    };
    /**
     * fromId: is mandatory
     * roomId or toId: is mandatory
     */
    let fromId;
    let roomId;
    let toId;
    let text;
    let mentionIdList = [];
    // enterprise wechat
    if (is_type_1.isRoomId(message.fromusername) || is_type_1.isIMRoomId(message.fromusername)) {
        // room message sent by others
        roomId = message.fromusername;
        // text:    "wxid_xxxx:\nnihao"
        // appmsg:  "wxid_xxxx:\n<?xml version="1.0"?><msg><appmsg appid="" sdkver="0">..."
        // pat:     "19850419xxx@chatroom:\n<sysmsg type="pat"><pat><fromusername>xxx</fromusername><chatusername>19850419xxx@chatroom</chatusername><pattedusername>wxid_xxx</pattedusername>...<template><![CDATA["${vagase}" 拍了拍我]]></template></pat></sysmsg>"
        // separator of talkerId and content
        const separatorIndex = message.content.indexOf(":\n");
        if (separatorIndex !== -1) {
            const takerIdPrefix = message.content.slice(0, separatorIndex);
            // chat message
            if (is_type_1.isContactId(takerIdPrefix) || is_type_1.isIMContactId(takerIdPrefix)) {
                fromId = takerIdPrefix;
                text = message.content.slice(separatorIndex + 2);
            }
            else if (is_type_1.isRoomId(takerIdPrefix) || is_type_1.isIMRoomId(takerIdPrefix)) {
                // pat and other system message
                text = message.content.slice(separatorIndex + 2);
                // extract talkerId for pat message from payload
                const patMessage = await message_pat_1.isPatMessage(message);
                if (patMessage) {
                    const patMessagePayload = await message_pat_1.patMessageParser(message);
                    fromId = patMessagePayload.fromusername;
                    // TODO check is right?
                    // text = patMessagePayload.template;
                }
            }
        }
    }
    else if (is_type_1.isRoomId(message.tousername) || is_type_1.isIMRoomId(message.tousername)) {
        // room message sent by self
        roomId = message.tousername;
        fromId = message.fromusername;
        // const startIndex = message.content.indexOf(":\n");
        // text = message.content.slice(startIndex !== -1 ? startIndex + 2 : 0);
        // TODO check is right?
        text = message.content.slice(0);
    }
    else {
        // single chat message
        fromId = message.fromusername;
        toId = message.tousername;
    }
    if (!text) {
        text = message.content;
    }
    // set mention list
    if (roomId) {
        if (message.atList.length === 1 && message.atList[0] === "announcement@all") {
            const roomPayload = await puppet.roomPayload(roomId);
            mentionIdList = roomPayload.memberIdList;
        }
        else {
            mentionIdList = message.atList;
        }
    }
    /**
     * 7. Set text for quote message
     */
    // TODO:
    /*
    if (rawPayload.appMsgType === WechatAppMessageType.QuoteMessage) {
      text = await quotePayloadParser(rawPayload);
    }
     */
    let payload;
    // Two branch is the same code.
    // Only for making TypeScript happy
    if (fromId && toId) {
        payload = {
            ...payloadBase,
            fromId,
            mentionIdList,
            roomId,
            text,
            toId,
        };
    }
    else if (roomId) {
        payload = {
            ...payloadBase,
            fromId,
            mentionIdList,
            roomId,
            text,
            toId,
        };
    }
    else {
        throw new Error("neither toId nor roomId");
    }
    await _adjustMessageByAppMsg(message, payload);
    return payload;
}
exports.padLocalMessageToWechaty = padLocalMessageToWechaty;
function padLocalContactToWechaty(contact) {
    return {
        id: contact.username,
        gender: contact.gender,
        type: is_type_1.isContactOfficialId(contact.username) ? wechaty_puppet_1.ContactType.Official : wechaty_puppet_1.ContactType.Individual,
        name: contact.nickname,
        avatar: contact.avatar,
        alias: contact.remark,
        weixin: contact.alias,
        city: contact.city,
        friend: !contact.stranger,
        province: contact.province,
        signature: contact.signature,
        phone: contact.phoneList,
    };
}
exports.padLocalContactToWechaty = padLocalContactToWechaty;
function padLocalRoomToWechaty(contact) {
    return {
        adminIdList: [],
        avatar: contact.avatar,
        id: contact.username,
        memberIdList: contact.chatroommemberList.map((member) => member.username),
        ownerId: contact.chatroomownerusername,
        topic: contact.nickname,
    };
}
exports.padLocalRoomToWechaty = padLocalRoomToWechaty;
function padLocalRoomMemberToWechaty(chatRoomMember) {
    return {
        id: chatRoomMember.username,
        roomAlias: chatRoomMember.displayname,
        inviterId: chatRoomMember.inviterusername,
        avatar: chatRoomMember.avatar,
        name: chatRoomMember.nickname,
    };
}
exports.padLocalRoomMemberToWechaty = padLocalRoomMemberToWechaty;
async function _adjustMessageByAppMsg(message, payload) {
    if (payload.type !== wechaty_puppet_1.MessageType.Attachment) {
        return;
    }
    try {
        const appPayload = await message_appmsg_1.appMessageParser(message);
        switch (appPayload.type) {
            case message_appmsg_1.AppMessageType.Text:
                payload.type = wechaty_puppet_1.MessageType.Text;
                payload.text = appPayload.title;
                break;
            case message_appmsg_1.AppMessageType.Audio:
                payload.type = wechaty_puppet_1.MessageType.Url;
                break;
            case message_appmsg_1.AppMessageType.Video:
                payload.type = wechaty_puppet_1.MessageType.Url;
                break;
            case message_appmsg_1.AppMessageType.Url:
                payload.type = wechaty_puppet_1.MessageType.Url;
                break;
            case message_appmsg_1.AppMessageType.Attach:
                payload.type = wechaty_puppet_1.MessageType.Attachment;
                payload.filename = appPayload.title;
                break;
            case message_appmsg_1.AppMessageType.ChatHistory:
                payload.type = wechaty_puppet_1.MessageType.ChatHistory;
                break;
            case message_appmsg_1.AppMessageType.MiniProgram:
            case message_appmsg_1.AppMessageType.MiniProgramApp:
                payload.type = wechaty_puppet_1.MessageType.MiniProgram;
                break;
            case message_appmsg_1.AppMessageType.RedEnvelopes:
                payload.type = wechaty_puppet_1.MessageType.RedEnvelope;
                break;
            case message_appmsg_1.AppMessageType.Transfers:
                payload.type = wechaty_puppet_1.MessageType.Transfer;
                break;
            case message_appmsg_1.AppMessageType.RealtimeShareLocation:
                payload.type = wechaty_puppet_1.MessageType.Location;
                break;
            case message_appmsg_1.AppMessageType.GroupNote:
                payload.type = wechaty_puppet_1.MessageType.GroupNote;
                payload.text = appPayload.title;
                break;
            case message_appmsg_1.AppMessageType.ReferMsg:
                payload.type = wechaty_puppet_1.MessageType.Text;
                payload.text = `「${appPayload.refermsg.displayname}：${appPayload.refermsg.content}」\n- - - - - - - - - - - - - - - -\n${appPayload.title}`;
                break;
            default:
                payload.type = wechaty_puppet_1.MessageType.Unknown;
                break;
        }
    }
    catch (e) {
        wechaty_puppet_1.log.warn(PRE, `Error occurred while parse message attachment: ${JSON.stringify(message)} , ${e.stack}`);
    }
}
function chatRoomMemberToContact(chatRoomMember) {
    return new padlocal_pb_1.Contact()
        .setUsername(chatRoomMember.getUsername())
        .setNickname(chatRoomMember.getNickname())
        .setAvatar(chatRoomMember.getAvatar())
        .setStranger(true);
}
exports.chatRoomMemberToContact = chatRoomMemberToContact;
//# sourceMappingURL=index.js.map