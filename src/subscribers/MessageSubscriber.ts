import { EntitySubscriberInterface, EventSubscriber, RemoveEvent } from "typeorm";
import { Message } from "../entities/Message";

@EventSubscriber()
export class MessageSubscriber implements EntitySubscriberInterface<Message> {
    listenTo() {
        return Message;
    }

    async afterRemove(event: RemoveEvent<Message>) {
        // Custom logic after message removal
    }
}
