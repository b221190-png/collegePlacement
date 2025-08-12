export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  branch: string;
  email: string;
  cgpa: number;
  phone: string;
  skills: string[];
  resume?: string;
}

export interface Round {
  id: string;
  name: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  description: string;
  selectedStudents: Student[];
  totalApplied: number;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  industry: string;
  location: string;
  packageOffered: string;
  applicationDeadline: string;
  status: 'open' | 'closed' | 'results';
  requirements: string[];
  rounds: Round[];
  totalPositions: number;
  applicationLink?: string;
}

export interface ApplicationForm {
  studentName: string;
  rollNumber: string;
  email: string;
  phone: string;
  branch: string;
  cgpa: number;
  skills: string;
  experience: string;
  whyCompany: string;
  resume: File | null;
}

export interface OffCampusOpportunity {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  type: 'internship' | 'full-time' | 'freelance' | 'remote' | 'part-time';
  location: string;
  isRemote: boolean;
  duration?: string;
  stipend?: string;
  salary?: string;
  description: string;
  requirements: string[];
  skills: string[];
  applicationDeadline: string;
  postedDate: string;
  applicationLink: string;
  industry: string;
  experience: 'fresher' | 'experienced' | 'any';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'student';
  companyId?: string; // For recruiters
}

export interface Application {
  id: string;
  studentId: string;
  companyId: string;
  roundId?: string;
  status: 'submitted' | 'under-review' | 'shortlisted' | 'rejected' | 'selected';
  submittedAt: string;
  score?: number;
  notes?: string;
  formData: ApplicationForm;
}

export interface CompanyOnboarding {
  name: string;
  logo: string;
  description: string;
  industry: string;
  location: string;
  packageOffered: string;
  totalPositions: number;
  requirements: string[];
  applicationDeadline: string;
  rounds: {
    name: string;
    description: string;
    date: string;
  }[];
  recruiterEmail: string;
  recruiterName: string;
}