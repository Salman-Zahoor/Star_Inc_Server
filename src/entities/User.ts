import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Message } from "./Message";
import { Conversation } from "./Conversation";


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    firstName?: string;

    @Column({nullable: true })
    profilePic?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ nullable: true })
    phone?: number;

    @Column({ default: true })
    isActive?: boolean;

    @Column({ unique: true, nullable: true })
    email?: string;

    @Column({ nullable: true })
    password?: string;

    @Column()
    role: string;

    @Column({ unique: true, nullable: true })
    guestId: string;

    @CreateDateColumn()
    createdAt: Date;

    @CreateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Message, message => message.user)
    messages: Message[];

    @OneToMany(() => Conversation, conversation => conversation.user)
    conversations: Conversation[];

    @Column()
    token?: string;
}
