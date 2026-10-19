export type MissionStatus = 'Not Started' | 'Working' | 'Completed';

export interface MissionUpdate {
    user: string;
    message: string;
    timestamp: any; // Date or Firestore Timestamp
}

export interface Mission {
    id: string;
    team: string; 
    description: string;
    importance: 'Low' | 'Medium' | 'High' | 'Critical';
    deadline: any; // Date or Firestore Timestamp
    assessmentPersons: string[]; 
    status: MissionStatus;
    processUpdates: MissionUpdate[];
    createdAt: any;
    updatedAt: any;
}

export interface MissionFormData {
    team: string;
    description: string;
    importance: 'Low' | 'Medium' | 'High' | 'Critical';
    deadline: string; // HTML input date string
    assessmentPersons: string[];
    status: MissionStatus;
}
