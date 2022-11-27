"use strict";
/**
 * Various business logics are carried by Message, resolve detailed logic from Message here.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMessage = void 0;
const message_parser_friendship_1 = __importDefault(require("./message-parser-friendship"));
const message_parser_room_invite_1 = __importDefault(require("./message-parser-room-invite"));
const message_parser_room_join_1 = __importDefault(require("./message-parser-room-join"));
const message_parser_room_leave_1 = __importDefault(require("./message-parser-room-leave"));
const message_parser_room_topic_1 = __importDefault(require("./message-parser-room-topic"));
const message_parser_1 = require("./message-parser");
const message_parser_type_1 = require("./message-parser-type");
message_parser_1.registerMessageParser(message_parser_type_1.MessageCategory.Friendship, message_parser_friendship_1.default);
message_parser_1.registerMessageParser(message_parser_type_1.MessageCategory.RoomInvite, message_parser_room_invite_1.default);
message_parser_1.registerMessageParser(message_parser_type_1.MessageCategory.RoomJoin, message_parser_room_join_1.default);
message_parser_1.registerMessageParser(message_parser_type_1.MessageCategory.RoomLeave, message_parser_room_leave_1.default);
message_parser_1.registerMessageParser(message_parser_type_1.MessageCategory.RoomTopic, message_parser_room_topic_1.default);
var message_parser_2 = require("./message-parser");
Object.defineProperty(exports, "parseMessage", { enumerable: true, get: function () { return message_parser_2.parseMessage; } });
//# sourceMappingURL=index.js.map