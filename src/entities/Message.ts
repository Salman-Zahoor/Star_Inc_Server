import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Conversation } from "./Conversation";

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column({ nullable: true })
    guestId: string; // Guest ID for anonymous messages


    @ManyToOne(() => User, user => user.messages)
    user: User;


    @ManyToOne(() => Conversation, conversation => conversation.messages, { nullable: true })
    conversation: Conversation;

}
