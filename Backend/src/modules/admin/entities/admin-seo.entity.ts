import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('admin_seo')
export class AdminSeo {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column() url: string;
  @Column() title: string;
  @Column({ default: '' }) canonicalUrl: string;
  @Column({ default: '' }) description: string;
  @Column({ default: '' }) keywords: string;
  @Column({ default: '' }) image: string;
  @Column({ default: '' }) author: string;
  @Column({ default: '' }) robots: string;
  @Column({ default: '' }) viewport: string;
  @Column({ default: '' }) ogTitle: string;
  @Column({ default: '' }) ogDescription: string;
  @Column({ default: '' }) ogImage: string;
  @Column({ default: '' }) ogType: string;
  @Column({ default: '' }) ogUrl: string;
  @Column({ default: '' }) ogSiteName: string;
  @Column({ default: '' }) ogLocale: string;
  @Column({ default: '' }) twitterCard: string;
  @Column({ default: '' }) twitterTitle: string;
  @Column({ default: '' }) twitterDescription: string;
  @Column({ default: '' }) twitterImage: string;
  @Column({ default: '' }) twitterSite: string;
  @Column({ default: '' }) twitterCreator: string;
  @Column('text', { default: '' }) structuredData: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}