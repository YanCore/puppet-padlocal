"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageFileName = exports.convertMessageType = void 0;
const wechaty_puppet_1 = require("wechaty-puppet");
const WechatMessageType_1 = require("../WechatMessageType");
function convertMessageType(wechatMessageType) {
    let type;
    switch (wechatMessageType) {
        case WechatMessageType_1.WechatMessageType.Text:
            type = wechaty_puppet_1.MessageType.Text;
            break;
        case WechatMessageType_1.WechatMessageType.Image:
            type = wechaty_puppet_1.MessageType.Image;
            break;
        case WechatMessageType_1.WechatMessageType.Voice:
            type = wechaty_puppet_1.MessageType.Audio;
            break;
        case WechatMessageType_1.WechatMessageType.Emoticon:
            type = wechaty_puppet_1.MessageType.Emoticon;
            break;
        case WechatMessageType_1.WechatMessageType.App:
        case WechatMessageType_1.WechatMessageType.File:
            type = wechaty_puppet_1.MessageType.Attachment;
            break;
        case WechatMessageType_1.WechatMessageType.Location:
            type = wechaty_puppet_1.MessageType.Location;
            break;
        case WechatMessageType_1.WechatMessageType.Video:
            type = wechaty_puppet_1.MessageType.Video;
            break;
        case WechatMessageType_1.WechatMessageType.Sys:
            type = wechaty_puppet_1.MessageType.Unknown;
            break;
        case WechatMessageType_1.WechatMessageType.ShareCard:
            type = wechaty_puppet_1.MessageType.Contact;
            break;
        case WechatMessageType_1.WechatMessageType.VoipMsg:
        case WechatMessageType_1.WechatMessageType.Recalled:
            type = wechaty_puppet_1.MessageType.Recalled;
            break;
        case WechatMessageType_1.WechatMessageType.StatusNotify:
        case WechatMessageType_1.WechatMessageType.SysNotice:
            type = wechaty_puppet_1.MessageType.Unknown;
            break;
        default:
            throw new Error(`unsupported type: ${wechatMessageType}`);
    }
    return type;
}
exports.convertMessageType = convertMessageType;
function getMessageFileName(message, messageType) {
    const msgId = message.id;
    if (messageType === wechaty_puppet_1.MessageType.Audio) {
        return msgId + ".slk";
    }
    else if (messageType === wechaty_puppet_1.MessageType.Image) {
        return msgId + ".jpg";
    }
    else if (messageType === wechaty_puppet_1.MessageType.Video) {
        return msgId + ".mp4";
    }
    return messageType + "-to-be-implement.txt";
}
exports.getMessageFileName = getMessageFileName;
//# sourceMappingURL=message.js.map