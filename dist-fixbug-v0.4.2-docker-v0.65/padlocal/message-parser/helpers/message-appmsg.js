"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appMessageParser = exports.AppMessageType = void 0;
const xml_to_json_1 = require("../../utils/xml-to-json");
var AppMessageType;
(function (AppMessageType) {
    AppMessageType[AppMessageType["Text"] = 1] = "Text";
    AppMessageType[AppMessageType["Img"] = 2] = "Img";
    AppMessageType[AppMessageType["Audio"] = 3] = "Audio";
    AppMessageType[AppMessageType["Video"] = 4] = "Video";
    AppMessageType[AppMessageType["Url"] = 5] = "Url";
    AppMessageType[AppMessageType["Attach"] = 6] = "Attach";
    AppMessageType[AppMessageType["Open"] = 7] = "Open";
    AppMessageType[AppMessageType["Emoji"] = 8] = "Emoji";
    AppMessageType[AppMessageType["VoiceRemind"] = 9] = "VoiceRemind";
    AppMessageType[AppMessageType["ScanGood"] = 10] = "ScanGood";
    AppMessageType[AppMessageType["Good"] = 13] = "Good";
    AppMessageType[AppMessageType["Emotion"] = 15] = "Emotion";
    AppMessageType[AppMessageType["CardTicket"] = 16] = "CardTicket";
    AppMessageType[AppMessageType["RealtimeShareLocation"] = 17] = "RealtimeShareLocation";
    AppMessageType[AppMessageType["ChatHistory"] = 19] = "ChatHistory";
    AppMessageType[AppMessageType["MiniProgram"] = 33] = "MiniProgram";
    AppMessageType[AppMessageType["MiniProgramApp"] = 36] = "MiniProgramApp";
    AppMessageType[AppMessageType["GroupNote"] = 53] = "GroupNote";
    AppMessageType[AppMessageType["ReferMsg"] = 57] = "ReferMsg";
    AppMessageType[AppMessageType["Transfers"] = 2000] = "Transfers";
    AppMessageType[AppMessageType["RedEnvelopes"] = 2001] = "RedEnvelopes";
    AppMessageType[AppMessageType["ReaderType"] = 100001] = "ReaderType";
})(AppMessageType = exports.AppMessageType || (exports.AppMessageType = {}));
async function appMessageParser(message) {
    const appMsgXml = await xml_to_json_1.xmlToJson(message.content);
    const { title, des, url, thumburl, type, md5, recorditem } = appMsgXml.msg.appmsg;
    let appattach;
    const tmp = appMsgXml.msg.appmsg.appattach;
    if (tmp) {
        appattach = {
            aeskey: tmp.aeskey,
            attachid: tmp.attachid,
            cdnattachurl: tmp.cdnattachurl,
            cdnthumbaeskey: tmp.cdnthumbaeskey,
            emoticonmd5: tmp.emoticonmd5,
            encryver: (tmp.encryver && parseInt(tmp.encryver, 10)) || 0,
            fileext: tmp.fileext,
            islargefilemsg: (tmp.islargefilemsg && parseInt(tmp.islargefilemsg, 10)) || 0,
            totallen: (tmp.totallen && parseInt(tmp.totallen, 10)) || 0,
        };
    }
    return {
        appattach,
        des,
        md5,
        recorditem,
        thumburl,
        title,
        type: parseInt(type, 10),
        url,
        refermsg: appMsgXml.msg.appmsg.refermsg,
    };
}
exports.appMessageParser = appMessageParser;
//# sourceMappingURL=message-appmsg.js.map