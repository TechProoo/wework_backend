// src/common/interfaces/user.interface.ts

export interface LoginResponse {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
  isVerified: boolean;
  verificationToken?: string | null;
  passwordResetToken?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  university?: string | null;
  major?: string | null;
  graduationYear?: string | null;
  enrollments: any[];
  payments: any[];
  applications: any[];
}
