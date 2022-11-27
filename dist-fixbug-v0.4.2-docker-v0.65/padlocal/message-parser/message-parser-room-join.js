"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wechaty_puppet_1 = require("wechaty-puppet");
const is_type_1 = require("../utils/is-type");
const xml_to_json_1 = require("../utils/xml-to-json");
const get_xml_label_1 = require("../utils/get-xml-label");
const message_parser_room_leave_1 = require("./message-parser-room-leave");
const ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_ZH = [
    /^你邀请"(.+)"加入了群聊 {2}\$revoke\$/,
    /^" ?(.+)"通过扫描你分享的二维码加入群聊/,
];
const ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_ZH = [
    /^"([^"]+?)"邀请你加入了群聊，群聊参与人还有：(.+)/,
    /^"([^"]+?)"邀请你和"(.+?)"加入了群聊/,
];
const ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_ZH = [/^"(.+)"邀请"(.+)"加入了群聊/];
const ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_ZH = [/^" (.+)"通过扫描"(.+)"分享的二维码加入群聊/];
const ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_EN = [
    /^You invited (.+) to the group chat/,
    /^" ?(.+)" joined group chat via the QR code you shared/,
];
const ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_EN = [/^(.+) invited you to a group chat with (.+)/];
const ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_EN = [/^(.+?) invited (.+?) to (the|a) group chat/];
const ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_EN = [
    /^"(.+)" joined the group chat via the QR Code shared by "(.+)"/,
];
exports.default = async (puppet, message) => {
    const roomId = message.fromusername;
    if (!is_type_1.isRoomId(roomId)) {
        return null;
    }
    const timestamp = message.createtime;
    let content = message.content;
    let linkList;
    const jsonPayload = await xml_to_json_1.xmlToJson(content);
    if (!jsonPayload || !jsonPayload.sysmsg || !jsonPayload.sysmsg.sysmsgtemplate) {
        return null;
    }
    content = jsonPayload.sysmsg.sysmsgtemplate.content_template.template;
    linkList = jsonPayload.sysmsg.sysmsgtemplate.content_template.link_list.link;
    /**
     * Process English language
     */
    let matchesForBotInviteOtherEn = null;
    let matchesForOtherInviteBotEn = null;
    let matchesForOtherInviteOtherEn = null;
    let matchesForOtherInviteOtherQrcodeEn = null;
    ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_EN.some((regex) => !!(matchesForBotInviteOtherEn = content.match(regex)));
    ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_EN.some((regex) => !!(matchesForOtherInviteBotEn = content.match(regex)));
    ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_EN.some((regex) => !!(matchesForOtherInviteOtherEn = content.match(regex)));
    ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_EN.some((regex) => !!(matchesForOtherInviteOtherQrcodeEn = content.match(regex)));
    /**
     * Process Chinese language
     */
    let matchesForBotInviteOtherZh = null;
    let matchesForOtherInviteBotZh = null;
    let matchesForOtherInviteOtherZh = null;
    let matchesForOtherInviteOtherQrcodeZh = null;
    ROOM_JOIN_BOT_INVITE_OTHER_REGEX_LIST_ZH.some((regex) => !!(matchesForBotInviteOtherZh = content.match(regex)));
    ROOM_JOIN_OTHER_INVITE_BOT_REGEX_LIST_ZH.some((regex) => !!(matchesForOtherInviteBotZh = content.match(regex)));
    ROOM_JOIN_OTHER_INVITE_OTHER_REGEX_LIST_ZH.some((regex) => !!(matchesForOtherInviteOtherZh = content.match(regex)));
    ROOM_JOIN_OTHER_INVITE_OTHER_QRCODE_REGEX_LIST_ZH.some((regex) => !!(matchesForOtherInviteOtherQrcodeZh = content.match(regex)));
    const matchesForBotInviteOther = matchesForBotInviteOtherEn || matchesForBotInviteOtherZh;
    const matchesForOtherInviteBot = matchesForOtherInviteBotEn || matchesForOtherInviteBotZh;
    const matchesForOtherInviteOther = matchesForOtherInviteOtherEn || matchesForOtherInviteOtherZh;
    const matchesForOtherInviteOtherQrcode = matchesForOtherInviteOtherQrcodeEn || matchesForOtherInviteOtherQrcodeZh;
    const matches = matchesForBotInviteOther ||
        matchesForOtherInviteBot ||
        matchesForOtherInviteOther ||
        matchesForOtherInviteOtherQrcode;
    if (!matches) {
        return null;
    }
    const stringToList = (inviteeIdList) => {
        return typeof inviteeIdList !== "string" ? inviteeIdList : [inviteeIdList];
    };
    let ret = null;
    /**
     * Parse all Names From the Event Text
     */
    if (matchesForBotInviteOther) {
        /**
         * 1. Bot Invite Other to join the Room
         *  (include invite via QrCode)
         */
        const other = matches[1];
        const inviteeIdList = get_xml_label_1.getUserName(linkList, other);
        ret = {
            inviteeIdList: stringToList(inviteeIdList),
            inviterId: (await puppet.roomMemberSearch(roomId, wechaty_puppet_1.YOU))[0],
            roomId,
            timestamp,
        };
    }
    else if (matchesForOtherInviteBot) {
        /**
         * 2. Other Invite Bot to join the Room
         */
        // /^"([^"]+?)"邀请你加入了群聊/,
        // /^"([^"]+?)"邀请你和"(.+?)"加入了群聊/,
        const _inviterName = matches[1];
        const inviterId = get_xml_label_1.getUserName(linkList, _inviterName);
        ret = {
            inviteeIdList: await puppet.roomMemberSearch(roomId, wechaty_puppet_1.YOU),
            inviterId,
            roomId,
            timestamp,
        };
    }
    else if (matchesForOtherInviteOther) {
        /**
         * 3. Other Invite Other to a Room
         *  (NOT include invite via Qrcode)
         */
        // /^"([^"]+?)"邀请"([^"]+)"加入了群聊$/,
        // /^([^"]+?) invited ([^"]+?) to (the|a) group chat/,
        const _inviterName = matches[1];
        const inviterId = get_xml_label_1.getUserName(linkList, _inviterName);
        const _others = matches[2];
        const inviteeIdList = get_xml_label_1.getUserName(linkList, _others);
        ret = {
            inviteeIdList: stringToList(inviteeIdList),
            inviterId,
            roomId,
            timestamp,
        };
    }
    else if (matchesForOtherInviteOtherQrcode) {
        /**
         * 4. Other Invite Other via Qrcode to join a Room
         *   /^" (.+)"通过扫描"(.+)"分享的二维码加入群聊/,
         */
        const _inviterName = matches[2];
        const inviterId = get_xml_label_1.getUserName(linkList, _inviterName);
        const other = matches[1];
        const inviteeIdList = get_xml_label_1.getUserName(linkList, other);
        ret = {
            inviteeIdList: stringToList(inviteeIdList),
            inviterId,
            roomId,
            timestamp,
        };
    }
    if (ret) {
        ret.inviteeIdList.forEach((inviteeId) => {
            message_parser_room_leave_1.removeRoomLeaveDebounce(ret.roomId, inviteeId);
        });
    }
    return ret;
};
//# sourceMappingURL=message-parser-room-join.js.map