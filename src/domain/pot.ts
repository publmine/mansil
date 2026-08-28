export interface DiaryEntry {
  id?: number;
  potId?: number;
  level?: number;
  question: string;
  content: string;
  date: string;
}

export interface Pot {
  id: number;
  name: string;
  adj: string;
  noun: string;
  level: number; // 0 to 5
  status: 'unlocked' | 'locked';
  type: 'neutral' | 'red' | 'green' | 'purple' | 'blue' | 'yellow';
  desc: string;
  colorRatios?: { [hex: string]: number };
  colors?: string[];
  templateId?: string;
  diaries?: { [level: number]: DiaryEntry };
  messageIndex?: number; // sequential index for messages[] array
  stepMandalas?: {
    [level: number]: {
      templateId: string;
      mandalaColors: { [segmentId: string]: string };
      paperTexture?: string;
      cottonColor?: string;
      date?: string;
    };
  };
}

export interface ArchivedPlant {
  id?: number;
  name: string;
  date: string;
  type: 'red' | 'green' | 'purple' | 'blue' | 'yellow';
  desc: string;
  colors: string[];
  templateId?: string;
  diaries?: { [level: number]: DiaryEntry };
  stepMandalas?: {
    [level: number]: {
      templateId: string;
      mandalaColors: { [segmentId: string]: string };
      paperTexture?: string;
      cottonColor?: string;
      date?: string;
    };
  };
}
