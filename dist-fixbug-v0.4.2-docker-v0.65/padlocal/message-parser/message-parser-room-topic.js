"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wechaty_puppet_1 = require("wechaty-puppet");
const is_type_1 = require("../utils/is-type");
const xml_to_json_1 = require("../utils/xml-to-json");
const get_xml_label_1 = require("../utils/get-xml-label");
const ROOM_TOPIC_OTHER_REGEX_LIST = [/^"(.+)" changed the group name to "(.+)"$/, /^"(.+)"修改群名为“(.+)”$/];
const ROOM_TOPIC_YOU_REGEX_LIST = [/^(You) changed the group name to "(.+)"$/, /^(你)修改群名为“(.+)”$/];
exports.default = async (puppet, message) => {
    const roomId = message.fromusername;
    if (!is_type_1.isRoomId(roomId)) {
        return null;
    }
    let content = message.content;
    const needParseXML = content.includes("你修改群名为") || content.includes("You changed the group name to");
    let linkList;
    if (!needParseXML) {
        const roomXml = await xml_to_json_1.xmlToJson(content);
        if (!roomXml || !roomXml.sysmsg || !roomXml.sysmsg.sysmsgtemplate) {
            return null;
        }
        content = roomXml.sysmsg.sysmsgtemplate.content_template.template;
        linkList = roomXml.sysmsg.sysmsgtemplate.content_template.link_list.link;
    }
    let matchesForOther = [];
    let matchesForYou = [];
    ROOM_TOPIC_OTHER_REGEX_LIST.some((regex) => !!(matchesForOther = content.match(regex)));
    ROOM_TOPIC_YOU_REGEX_LIST.some((regex) => !!(matchesForYou = content.match(regex)));
    const matches = matchesForOther || matchesForYou;
    if (!matches) {
        return null;
    }
    let changerId = matches[1];
    let topic = matches[2];
    if ((matchesForYou && changerId === "你") || changerId === "You") {
        changerId = (await puppet.roomMemberSearch(roomId, wechaty_puppet_1.YOU))[0];
    }
    else {
        changerId = get_xml_label_1.getUserName(linkList, changerId);
        topic = get_xml_label_1.getNickName(linkList, topic);
    }
    const room = await puppet.roomPayload(roomId);
    const oldTopic = room.topic;
    return {
        changerId,
        roomId,
        timestamp: message.createtime,
        oldTopic,
        newTopic: topic,
    };
};
//# sourceMappingURL=message-parser-room-topic.js.map