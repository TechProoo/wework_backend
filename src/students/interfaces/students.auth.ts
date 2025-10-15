export interface SignupResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    university: string;
    major: string;
    graduationYear: string;
    createdAt: Date;
  };
}

export interface StudentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  university: string;
  major: string;
  graduationYear: string;
  passwordHash?: string;
  createdAt: Date;
}
