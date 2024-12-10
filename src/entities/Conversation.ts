import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, Column } from "typeorm";
import { User } from "./User";
import { Message } from "./Message";

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.conversations)
    user: User;

    @Column()
    guestId: string;

    @OneToMany(() => Message, message => message.conversation)
    messages: Message[];
}
