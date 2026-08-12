import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(20, { message: 'Username must be at most 20 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores.',
    }),
  university: z.string().min(2, { message: 'University name is required.' }),
  degree: z.string().min(2, { message: 'Degree/Major is required.' }),
  semester: z.string().min(1, { message: 'Semester/Year is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters.' }).optional().or(z.literal('')),
  experienceLevel: z.string().min(1, { message: 'Please select an overall experience level.' }),
  availability: z.string().min(1, { message: 'Please select your weekly availability.' }),
});

export type ProfileValues = z.infer<typeof profileSchema>;
