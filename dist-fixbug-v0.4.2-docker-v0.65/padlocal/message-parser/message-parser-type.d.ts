import { Message } from "padlocal-client-ts/dist/proto/padlocal_pb";
import { EventRoomJoinPayload, EventRoomLeavePayload, EventRoomTopicPayload, FriendshipPayload, RoomInvitationPayload } from "wechaty-puppet";
export declare enum MessageCategory {
    NormalMessage = 0,
    Friendship = 1,
    RoomInvite = 2,
    RoomJoin = 3,
    RoomLeave = 4,
    RoomTopic = 5
}
export interface ParsedMessagePayloadSpec {
    [MessageCategory.NormalMessage]: Message.AsObject;
    [MessageCategory.Friendship]: FriendshipPayload;
    [MessageCategory.RoomInvite]: RoomInvitationPayload;
    [MessageCategory.RoomJoin]: EventRoomJoinPayload;
    [MessageCategory.RoomLeave]: EventRoomLeavePayload;
    [MessageCategory.RoomTopic]: EventRoomTopicPayload;
}
export interface ParsedMessage<T extends keyof ParsedMessagePayloadSpec> {
    category: T;
    payload: ParsedMessagePayloadSpec[T];
}
//# sourceMappingURL=message-parser-type.d.ts.map