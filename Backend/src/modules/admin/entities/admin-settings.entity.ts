import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('admin_settings')
export class AdminSettings {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  waflowLogo: string;

  @Column({ nullable: true })
  darkModeLogo: string;

  @Column({ nullable: true })
  favicon: string;

  @Column({ type: 'simple-json', nullable: true })
  smtpSettings: any;

  @Column({ type: 'simple-json', nullable: true })
  emailTriggers: any;

  @Column({ type: 'simple-json', nullable: true })
  adminAlerts: any;

  @Column({ type: 'simple-json', nullable: true })
  emailTemplates: any;

  @Column({ type: 'simple-json', nullable: true })
  paymentGatewaySettings: any;

  @Column({ type: 'simple-json', nullable: true })
  taxConfiguration: any;

  @Column({ type: 'simple-json', nullable: true })
  planParameters: any;

  @Column({ type: 'simple-json', nullable: true })
  invoiceSettings: any;

  @Column({ type: 'simple-json', nullable: true })
  uiPreferences: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
