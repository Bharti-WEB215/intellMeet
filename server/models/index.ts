// server/models/index.ts — All Mongoose models for IntellMeet
import mongoose, { Schema, Document, Types } from 'mongoose';

// ═══════════════════════════════════════════
//  USER
// ═══════════════════════════════════════════
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member' | 'viewer';
  avatar: string;
  company: string;
  organizationId?: Types.ObjectId;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  avatar:       { type: String, default: '' },
  company:      { type: String, default: '' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  isOnline:     { type: Boolean, default: false },
  lastSeen:     { type: Date, default: Date.now },
}, { timestamps: true });


UserSchema.index({ organizationId: 1 });

// ═══════════════════════════════════════════
//  ORGANIZATION
// ═══════════════════════════════════════════
export interface IOrganization extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  name:    { type: String, required: true },
  slug:    { type: String, required: true, unique: true, lowercase: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  MEETING
// ═══════════════════════════════════════════
export interface IMeeting extends Document {
  title: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  creatorId: Types.ObjectId;
  participants: Array<{
    userId: Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
    role: 'host' | 'participant';
  }>;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // seconds
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>({
  title:    { type: String, required: true },
  status:   { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'active' },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    userId:   { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt:   { type: Date },
    role:     { type: String, enum: ['host', 'participant'], default: 'participant' },
  }],
  startTime:    { type: Date, default: Date.now },
  endTime:      { type: Date },
  duration:     { type: Number },
  recordingUrl: { type: String },
}, { timestamps: true });

MeetingSchema.index({ creatorId: 1 });
MeetingSchema.index({ status: 1 });
MeetingSchema.index({ createdAt: -1 });

// ═══════════════════════════════════════════
//  TRANSCRIPT
// ═══════════════════════════════════════════
export interface ITranscript extends Document {
  meetingId: Types.ObjectId;
  speakerName: string;
  speakerId?: Types.ObjectId;
  text: string;
  timestamp: Date;
  confidence?: number;
}

const TranscriptSchema = new Schema<ITranscript>({
  meetingId:   { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
  speakerName: { type: String, required: true },
  speakerId:   { type: Schema.Types.ObjectId, ref: 'User' },
  text:        { type: String, required: true },
  timestamp:   { type: Date, default: Date.now },
  confidence:  { type: Number, min: 0, max: 1 },
});

TranscriptSchema.index({ meetingId: 1, timestamp: 1 });

// ═══════════════════════════════════════════
//  MEETING ANALYTICS
// ═══════════════════════════════════════════
export interface IMeetingAnalytics extends Document {
  meetingId: Types.ObjectId;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  stressPercent: number;
  engagementPercent: number;
  collaborationPercent: number;
  decisionQuality: number;
  focusScore: number;
  energyScore: number;
  participationBalance: number;
  actionability: number;
  createdAt: Date;
}

const MeetingAnalyticsSchema = new Schema<IMeetingAnalytics>({
  meetingId:            { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
  positivePercent:      { type: Number, default: 0 },
  neutralPercent:       { type: Number, default: 0 },
  negativePercent:      { type: Number, default: 0 },
  stressPercent:        { type: Number, default: 0 },
  engagementPercent:    { type: Number, default: 0 },
  collaborationPercent: { type: Number, default: 0 },
  decisionQuality:      { type: Number, default: 0 },
  focusScore:           { type: Number, default: 0 },
  energyScore:          { type: Number, default: 0 },
  participationBalance: { type: Number, default: 0 },
  actionability:        { type: Number, default: 0 },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  TASK
// ═══════════════════════════════════════════
export interface ITask extends Document {
  title: string;
  description: string;
  assigneeName: string;
  assigneeAvatar: string;
  assigneeId?: Types.ObjectId;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  deadline: string;
  meetingId?: Types.ObjectId;
  creatorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  assigneeName:   { type: String, default: 'Unassigned' },
  assigneeAvatar: { type: String, default: '' },
  assigneeId:     { type: Schema.Types.ObjectId, ref: 'User' },
  priority:       { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:         { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
  deadline:       { type: String, default: '' },
  meetingId:      { type: Schema.Types.ObjectId, ref: 'Meeting' },
  creatorId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

TaskSchema.index({ creatorId: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ meetingId: 1 });

// ═══════════════════════════════════════════
//  DOCUMENT
// ═══════════════════════════════════════════
export interface IDocument extends Document {
  title: string;
  content: string;
  authorId: Types.ObjectId;
  authorName: string;
  lastUpdated: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  title:       { type: String, required: true },
  content:     { type: String, default: '' },
  authorId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName:  { type: String, default: '' },
  lastUpdated: { type: String, default: '' },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  WORKSPACE CHANNEL
// ═══════════════════════════════════════════
export interface IWorkspaceChannel extends Document {
  name: string;
  type: 'text' | 'voice' | 'announcement';
  description: string;
  members: Types.ObjectId[];
  unread: boolean;
  createdAt: Date;
}

const WorkspaceChannelSchema = new Schema<IWorkspaceChannel>({
  name:        { type: String, required: true },
  type:        { type: String, enum: ['text', 'voice', 'announcement'], default: 'text' },
  description: { type: String, default: '' },
  members:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  unread:      { type: Boolean, default: false },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  WORKSPACE MESSAGE
// ═══════════════════════════════════════════
export interface IWorkspaceMessage extends Document {
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

const WorkspaceMessageSchema = new Schema<IWorkspaceMessage>({
  channelId:  { type: Schema.Types.ObjectId, ref: 'WorkspaceChannel', required: true, index: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  text:       { type: String, required: true },
}, { timestamps: true });

WorkspaceMessageSchema.index({ channelId: 1, createdAt: -1 });

// ═══════════════════════════════════════════
//  NOTIFICATION
// ═══════════════════════════════════════════
export interface INotification extends Document {
  userId: Types.ObjectId;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai';
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['info', 'success', 'warning', 'error', 'ai'], default: 'info' },
  read:    { type: Boolean, default: false },
  link:    { type: String },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// ═══════════════════════════════════════════
//  WORKSPACE ASSET (File)
// ═══════════════════════════════════════════
export interface IWorkspaceAsset extends Document {
  name: string;
  type: string;
  size: string;
  url: string;
  cloudinaryId?: string;
  uploadedBy: Types.ObjectId;
  uploaderName: string;
  createdAt: Date;
}

const WorkspaceAssetSchema = new Schema<IWorkspaceAsset>({
  name:          { type: String, required: true },
  type:          { type: String, default: 'file' },
  size:          { type: String, default: '0 KB' },
  url:           { type: String, default: '' },
  cloudinaryId:  { type: String },
  uploadedBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploaderName:  { type: String, default: '' },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  ACTIVITY LOG
// ═══════════════════════════════════════════
export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string;
  action: string;
  target?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  action:     { type: String, required: true },
  target:     { type: String },
}, { timestamps: true });

ActivityLogSchema.index({ createdAt: -1 });

// ═══════════════════════════════════════════
//  SENTIMENT SCORE (time-series per meeting)
// ═══════════════════════════════════════════
export interface ISentimentScore extends Document {
  meetingId: Types.ObjectId;
  timestamp: Date;
  positive: number;
  negative: number;
  neutral: number;
  label: string;
}

const SentimentScoreSchema = new Schema<ISentimentScore>({
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  positive:  { type: Number, default: 0 },
  negative:  { type: Number, default: 0 },
  neutral:   { type: Number, default: 0 },
  label:     { type: String, default: '' },
});

// ═══════════════════════════════════════════
//  MEETING INSIGHT
// ═══════════════════════════════════════════
export interface IMeetingInsight extends Document {
  meetingId: Types.ObjectId;
  type: 'risk' | 'decision' | 'action' | 'highlight';
  content: string;
  confidence: number;
  createdAt: Date;
}

const MeetingInsightSchema = new Schema<IMeetingInsight>({
  meetingId:  { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
  type:       { type: String, enum: ['risk', 'decision', 'action', 'highlight'], required: true },
  content:    { type: String, required: true },
  confidence: { type: Number, default: 0.8 },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  MEETING MESSAGE (in-meeting chat)
// ═══════════════════════════════════════════
export interface IMeetingMessage extends Document {
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  text: string;
  createdAt: Date;
}

const MeetingMessageSchema = new Schema<IMeetingMessage>({
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, default: '' },
  text:      { type: String, required: true },
}, { timestamps: true });

// ═══════════════════════════════════════════
//  EXPORT MODELS
// ═══════════════════════════════════════════
export const User               = mongoose.model<IUser>('User', UserSchema);
export const Organization       = mongoose.model<IOrganization>('Organization', OrganizationSchema);
export const Meeting            = mongoose.model<IMeeting>('Meeting', MeetingSchema);
export const Transcript         = mongoose.model<ITranscript>('Transcript', TranscriptSchema);
export const MeetingAnalytics   = mongoose.model<IMeetingAnalytics>('MeetingAnalytics', MeetingAnalyticsSchema);
export const Task               = mongoose.model<ITask>('Task', TaskSchema);
export const Doc                = mongoose.model<IDocument>('Document', DocumentSchema);
export const WorkspaceChannel   = mongoose.model<IWorkspaceChannel>('WorkspaceChannel', WorkspaceChannelSchema);
export const WorkspaceMessage   = mongoose.model<IWorkspaceMessage>('WorkspaceMessage', WorkspaceMessageSchema);
export const Notification       = mongoose.model<INotification>('Notification', NotificationSchema);
export const WorkspaceAsset     = mongoose.model<IWorkspaceAsset>('WorkspaceAsset', WorkspaceAssetSchema);
export const ActivityLog        = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const SentimentScore     = mongoose.model<ISentimentScore>('SentimentScore', SentimentScoreSchema);
export const MeetingInsight     = mongoose.model<IMeetingInsight>('MeetingInsight', MeetingInsightSchema);
export const MeetingMessage     = mongoose.model<IMeetingMessage>('MeetingMessage', MeetingMessageSchema);
