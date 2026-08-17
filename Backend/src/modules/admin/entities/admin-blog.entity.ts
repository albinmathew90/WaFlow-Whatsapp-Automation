import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('admin_blogs')
export class AdminBlog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  title: string;

  @Column()
  topic: string;

  @Column()
  author: string;

  @Column()
  date: string;

  @Column()
  readMinutes: string;

  @Column()
  slug: string;

  @Column()
  description: string;

  @Column('text')
  content: string;

  @Column()
  image: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}