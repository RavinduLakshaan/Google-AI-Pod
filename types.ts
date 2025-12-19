
import React from 'react';

export interface Source {
  title?: string;
  uri: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: Source[];
  attachment?: Attachment;
  isError?: boolean;
  feedback?: 'positive' | 'negative' | null;
}

export interface QuickAction {
  label: string;
  query: string;
  icon: React.ReactNode;
}

export interface IncidentReport {
  name: string;
  contact: string;
  serviceType: string;
  serviceId: string;
  incidentType: string;
  description: string;
}

export interface ConversationAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0 to 100
  summary: string;
  keyTopics: string[];
  customerIntent: string;
  unresolvedIssues: string[];
  adminRecommendations: string[];
  criticality: 'low' | 'medium' | 'high';
}
