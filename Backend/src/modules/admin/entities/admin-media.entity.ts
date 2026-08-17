import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('admin_media')
export class AdminMedia {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  fileName: string;

  @Column()
  thumbnail: string;

  @Column()
  alt: string;

  @Column()
  url: string;

  @Column()
  thumbnailUrl: string;

  @Column()
  fileSize: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}