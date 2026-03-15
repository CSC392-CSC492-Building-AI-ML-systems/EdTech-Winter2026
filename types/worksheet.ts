// Worksheet Response Types
export interface WorksheetData {
  id: number;
  classroomId: number | null;
  title: string;
  description?: string;
  createdByUserId: number;
  isAssigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetWorksheetsByTitleResponse {
  worksheets: WorksheetData[];
}
