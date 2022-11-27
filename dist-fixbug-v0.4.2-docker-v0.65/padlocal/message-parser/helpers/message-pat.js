"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patMessageParser = exports.isPatMessage = void 0;
const xml_to_json_1 = require("../../utils/xml-to-json");
async function isPatMessage(message) {
    const content = message.content.trim();
    const parts = content.split(":");
    if (parts.length < 1) {
        return false;
    }
    const xml = parts[1];
    if (!xml) {
        return false;
    }
    const patXml = await xml_to_json_1.xmlToJson(xml);
    return patXml.sysmsg.$.type === "pat";
}
exports.isPatMessage = isPatMessage;
async function patMessageParser(message) {
    const content = message.content.trim();
    const parts = content.split(":");
    const chatroom = parts[0];
    const xml = parts[1];
    const patXml = await xml_to_json_1.xmlToJson(xml);
    return {
        chatroom,
        fromusername: patXml.sysmsg.pat.fromusername,
        chatusername: patXml.sysmsg.pat.chatusername,
        pattedusername: patXml.sysmsg.pat.pattedusername,
        template: patXml.sysmsg.pat.template,
    };
}
exports.patMessageParser = patMessageParser;
//# sourceMappingURL=message-pat.js.map