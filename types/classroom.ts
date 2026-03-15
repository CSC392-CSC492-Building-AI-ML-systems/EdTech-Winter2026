// Classroom Response Types
export interface ClassroomData {
  id: number;
  name: string;
  classCode: string;
  ownerUserId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetClassroomsByTeacherResponse {
  classes: ClassroomData[];
}

export interface GetClassroomsByStudentResponse {
  classes: ClassroomData[];
}
