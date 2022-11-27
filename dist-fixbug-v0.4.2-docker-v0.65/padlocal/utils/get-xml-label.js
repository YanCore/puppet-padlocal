"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNickName = exports.getUserName = void 0;
function getUserName(linkList, name) {
    const otherObjectArray = linkList.filter((link) => name.includes(link.$.name));
    if (!otherObjectArray || otherObjectArray.length === 0) {
        return null;
    }
    const otherObject = otherObjectArray[0];
    const inviteeList = otherObject.memberlist.member;
    const inviteeIdList = inviteeList.length ? inviteeList.map((i) => i.username) : inviteeList.username;
    return inviteeIdList;
}
exports.getUserName = getUserName;
function getNickName(linkList, name) {
    const otherObjectArray = linkList.filter((link) => name.includes(link.$.name));
    if (!otherObjectArray || otherObjectArray.length === 0) {
        return null;
    }
    const otherObject = otherObjectArray[0];
    const inviteeList = otherObject.memberlist.member;
    const inviteeIdList = inviteeList.length ? inviteeList.map((i) => i.nickname) : inviteeList.nickname;
    return inviteeIdList;
}
exports.getNickName = getNickName;
//# sourceMappingURL=get-xml-label.js.map