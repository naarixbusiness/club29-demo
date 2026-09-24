import type { Offer, Plan, Program, Trainer } from './types';

export const PLANS: Plan[] = [
  { id: 'monthly', name: 'Monthly', kind: 'plan', price: 2999, months: 1, durationLabel: '1 month', access: 'Standard · 6 AM–10 PM', ptSessions: 0, status: 'active', benefits: ['Full gym floor access', 'Locker room & showers', 'Club29 member app', '1 fitness assessment'] },
  { id: 'quarterly', name: 'Quarterly', kind: 'plan', price: 7499, months: 3, durationLabel: '3 months', access: 'Standard · 6 AM–10 PM', ptSessions: 0, status: 'active', benefits: ['Everything in Monthly', 'Group classes, 2 / week', 'Monthly body composition scan', 'Workout plan in app'] },
  { id: 'half', name: 'Half Yearly', kind: 'plan', price: 12999, months: 6, durationLabel: '6 months', access: 'All hours · 5 AM–11 PM', ptSessions: 4, status: 'active', benefits: ['Everything in Quarterly', 'Unlimited group classes', 'Personalised diet plan', 'Freeze up to 15 days'] },
  { id: 'annual', name: 'Annual', kind: 'plan', price: 19999, months: 12, durationLabel: '12 months', access: 'All hours · 5 AM–11 PM', ptSessions: 12, status: 'active', popular: true, benefits: ['Everything in Half Yearly', '4 guest passes', 'Freeze up to 30 days', 'Priority PT booking'] },
  { id: 'pt12', name: 'Personal training · 12 sessions', kind: 'addon', price: 9999, months: 0, durationLabel: 'Add-on', access: '—', ptSessions: 12, status: 'active', benefits: [] },
  { id: 'diet', name: 'Diet consultation', kind: 'addon', price: 1499, months: 0, durationLabel: 'Add-on', access: '—', ptSessions: 0, status: 'active', benefits: [] },
  { id: 'couple', name: 'Couple Annual', kind: 'plan', price: 35999, months: 12, durationLabel: '12 months', access: 'All hours · 5 AM–11 PM', ptSessions: 0, status: 'active', benefits: ['Two members, one expiry', '4 guest passes', 'Freeze up to 30 days'] },
  { id: 'student', name: 'Student Monthly', kind: 'plan', price: 2199, months: 1, durationLabel: '1 month', access: 'Off-peak · 10 AM–5 PM', ptSessions: 0, status: 'disabled', benefits: ['Gym floor access', 'Valid college ID required'] },
];
export const MAIN_PLAN_IDS = ['monthly', 'quarterly', 'half', 'annual'];

export const OFFERS: Offer[] = [
  { code: 'FESTIVE15', description: '15% off Quarterly and above', window: '1–31 Oct 2026', status: 'Scheduled', uses: 0 },
  { code: 'FRIENDREF', description: '₹1,000 off for referrer and friend', window: 'Always on', status: 'Active', uses: 64 },
  { code: 'NEWYEAR26', description: '20% off Annual', window: '1–15 Jan 2026', status: 'Ended', uses: 212 },
];

export const TRAINERS: Trainer[] = [
  { id: 't-john', name: 'John Smith', title: 'Head trainer', specialization: 'Strength & conditioning', rating: 4.9, availability: 'Mon–Sat · 6–11 AM, 5–9 PM', status: 'Available', phone: '+91 98795 20411', joined: 'Jun 2018', bio: 'Former state-level powerlifter. Coaches strength, hypertrophy and injury-safe progressions. 8 years at Club29.', certs: ['ACE certified', 'K11 Sports Nutrition', 'First aid · CPR'], retention: 91, ptSessionsMonth: 142, ptRate: 1000 },
  { id: 't-aisha', name: 'Aisha Khan', title: 'Senior trainer', specialization: 'Yoga & mobility', rating: 4.8, availability: 'Mon–Fri · 7 AM–1 PM', status: 'In session', phone: '+91 99250 61872', joined: 'Mar 2020', bio: 'Yoga Alliance RYT-500. Runs mobility, recovery and women-only strength batches.', certs: ['RYT-500', 'Pre & post natal fitness'], retention: 88, ptSessionsMonth: 96, ptRate: 1000 },
  { id: 't-rohit', name: 'Rohit Verma', title: 'Trainer', specialization: 'Fat loss & HIIT', rating: 4.7, availability: 'Tue–Sun · 5–10 PM', status: 'Available', phone: '+91 97129 33584', joined: 'Jan 2021', bio: 'Conditioning coach for fat-loss transformations. Leads the evening HIIT batch.', certs: ['ISSA CPT', 'CrossFit L1'], retention: 86, ptSessionsMonth: 118, ptRate: 1000 },
  { id: 't-meera', name: 'Meera Nair', title: 'Trainer & nutritionist', specialization: 'Nutrition & functional', rating: 4.9, availability: 'Mon–Sat · 8 AM–2 PM', status: 'Off today', phone: '+91 98240 77195', joined: 'Aug 2022', bio: 'Certified nutritionist. Builds diet plans for Club29 members and coaches functional training.', certs: ['INFS Nutrition', 'ACE certified'], retention: 89, ptSessionsMonth: 74, ptRate: 1000 },
];

const ex = (name: string, muscle: string, sets: number, reps: string, rest: string, video: string) => ({ name, muscle, sets, reps, rest, video });

export const PROGRAMS: Program[] = [
  {
    id: 'p-beginner', name: 'Beginner Strength', level: 'Beginner', weeks: '8 weeks', daysPerWeek: 4, createdBy: 'John Smith', updated: new Date(2026, 7, 30), completion: 84,
    description: 'Full-body basics with machine and free-weight movements. Teaches form before load.', note: 'Keep 2 reps in reserve on every set for the first 3 weeks.',
    days: [
      { name: 'Day 1', focus: 'Full body A', exercises: [ex('Goblet Squat', 'Legs · Dumbbell', 3, '12', '75 s', '0:36'), ex('Chest Press Machine', 'Chest · Machine', 3, '12', '60 s', '0:30'), ex('Lat Pulldown', 'Back · Cable', 3, '12', '60 s', '0:33'), ex('Plank', 'Core · Bodyweight', 3, '30 s', '45 s', '0:25')] },
      { name: 'Day 2', focus: 'Full body B', exercises: [ex('Romanian Deadlift', 'Hamstrings · Dumbbell', 3, '10', '90 s', '0:40'), ex('Seated Row', 'Back · Cable', 3, '12', '60 s', '0:31'), ex('Shoulder Press Machine', 'Shoulders · Machine', 3, '12', '60 s', '0:29'), ex('Dead Bug', 'Core · Bodyweight', 3, '10', '45 s', '0:27')] },
      { name: 'Day 3', focus: 'Full body C', exercises: [ex('Leg Press', 'Legs · Machine', 3, '12', '75 s', '0:34'), ex('Push-up', 'Chest · Bodyweight', 3, '10', '60 s', '0:22'), ex('Assisted Pull-up', 'Back · Machine', 3, '8', '75 s', '0:35')] },
      { name: 'Day 4', focus: 'Conditioning', exercises: [ex('Rowing Machine', 'Cardio', 1, '12 min', '—', '0:28'), ex('Kettlebell Swing', 'Posterior chain', 3, '15', '60 s', '0:32'), ex('Farmer Carry', 'Grip · Core', 3, '30 m', '60 s', '0:24')] },
    ],
  },
  {
    id: 'p-fatloss', name: 'Fat Loss', level: 'Intermediate', weeks: '12 weeks', daysPerWeek: 5, createdBy: 'Rohit Verma', updated: new Date(2026, 8, 12), completion: 77,
    description: 'Strength circuits plus HIIT finishers to keep muscle while dropping body fat.', note: 'Pair with the 500 kcal deficit diet plan. Weigh in every Monday.',
    days: [
      { name: 'Day 1', focus: 'Lower + HIIT', exercises: [ex('Back Squat', 'Legs · Barbell', 4, '10', '90 s', '0:44'), ex('Walking Lunge', 'Legs · Dumbbell', 3, '12 / leg', '60 s', '0:30'), ex('Assault Bike Intervals', 'Cardio', 8, '20 s on', '40 s', '0:26')] },
      { name: 'Day 2', focus: 'Upper circuit', exercises: [ex('Push-up', 'Chest · Bodyweight', 4, '15', '45 s', '0:22'), ex('Dumbbell Row', 'Back · Dumbbell', 4, '12', '45 s', '0:31'), ex('Battle Ropes', 'Cardio', 4, '30 s', '30 s', '0:20')] },
      { name: 'Day 3', focus: 'Steady cardio', exercises: [ex('Incline Walk', 'Cardio', 1, '35 min', '—', '0:18'), ex('Hanging Knee Raise', 'Core', 3, '12', '45 s', '0:25')] },
      { name: 'Day 4', focus: 'Full body burn', exercises: [ex('Kettlebell Swing', 'Posterior chain', 4, '20', '45 s', '0:32'), ex('Thruster', 'Full body · Dumbbell', 4, '12', '60 s', '0:35'), ex('Burpee', 'Full body', 4, '10', '45 s', '0:21')] },
      { name: 'Day 5', focus: 'Mobility + core', exercises: [ex('Hip Flow', 'Mobility', 1, '10 min', '—', '0:40'), ex('Pallof Press', 'Core · Cable', 3, '12 / side', '45 s', '0:27')] },
    ],
  },
  {
    id: 'p-muscle', name: 'Muscle Building', level: 'Intermediate', weeks: '12 weeks', daysPerWeek: 6, createdBy: 'John Smith', updated: new Date(2026, 8, 18), completion: 81,
    description: 'Push / pull / legs split with progressive overload. Built for members with 6+ months of training who want visible size gains.',
    note: 'Add 2.5 kg on bench press when all 4 sets hit 12 reps with clean form. Members see this note in the app.',
    days: [
      { name: 'Day 1', focus: 'Chest & Triceps', exercises: [ex('Bench Press', 'Chest · Barbell', 4, '12', '90 s', '0:45'), ex('Incline Dumbbell Press', 'Upper chest · Dumbbell', 3, '10', '90 s', '0:38'), ex('Cable Fly', 'Chest · Cable', 3, '15', '60 s', '0:32'), ex('Weighted Dips', 'Chest, triceps · Bodyweight', 3, '10', '90 s', '0:41'), ex('Rope Pushdown', 'Triceps · Cable', 3, '12', '60 s', '0:29'), ex('Overhead Triceps Extension', 'Triceps · Dumbbell', 3, '12', '60 s', '0:35')] },
      { name: 'Day 2', focus: 'Back & Biceps', exercises: [ex('Deadlift', 'Back · Barbell', 4, '6', '120 s', '0:48'), ex('Pull-up', 'Lats · Bodyweight', 4, '8', '90 s', '0:30'), ex('Chest-supported Row', 'Mid back · Dumbbell', 3, '10', '75 s', '0:33'), ex('Straight-arm Pulldown', 'Lats · Cable', 3, '12', '60 s', '0:27'), ex('Barbell Curl', 'Biceps · Barbell', 3, '10', '60 s', '0:26'), ex('Hammer Curl', 'Biceps · Dumbbell', 3, '12', '60 s', '0:24')] },
      { name: 'Day 3', focus: 'Legs', exercises: [ex('Back Squat', 'Quads · Barbell', 4, '8', '120 s', '0:44'), ex('Romanian Deadlift', 'Hamstrings · Barbell', 3, '10', '90 s', '0:40'), ex('Leg Press', 'Quads · Machine', 3, '12', '90 s', '0:34'), ex('Leg Curl', 'Hamstrings · Machine', 3, '12', '60 s', '0:28'), ex('Standing Calf Raise', 'Calves · Machine', 4, '15', '45 s', '0:22')] },
      { name: 'Day 4', focus: 'Shoulders & Abs', exercises: [ex('Overhead Press', 'Shoulders · Barbell', 4, '8', '90 s', '0:39'), ex('Lateral Raise', 'Side delts · Dumbbell', 4, '15', '45 s', '0:25'), ex('Face Pull', 'Rear delts · Cable', 3, '15', '45 s', '0:28'), ex('Arnold Press', 'Shoulders · Dumbbell', 3, '10', '60 s', '0:31'), ex('Cable Crunch', 'Abs · Cable', 3, '15', '45 s', '0:23'), ex('Hanging Leg Raise', 'Abs · Bodyweight', 3, '12', '45 s', '0:25')] },
      { name: 'Day 5', focus: 'Upper power', exercises: [ex('Paused Bench Press', 'Chest · Barbell', 5, '5', '150 s', '0:42'), ex('Weighted Pull-up', 'Back · Bodyweight', 5, '5', '150 s', '0:30'), ex('Push Press', 'Shoulders · Barbell', 4, '5', '120 s', '0:36'), ex('Pendlay Row', 'Back · Barbell', 4, '6', '120 s', '0:34'), ex('Close-grip Bench', 'Triceps · Barbell', 3, '8', '90 s', '0:33')] },
      { name: 'Day 6', focus: 'Active recovery', exercises: [ex('Zone 2 Cycling', 'Cardio', 1, '30 min', '—', '0:18'), ex('Foam Rolling', 'Recovery', 1, '10 min', '—', '0:40'), ex('Hip Flow', 'Mobility', 1, '10 min', '—', '0:40'), ex('Dead Hang', 'Shoulders · Grip', 3, '30 s', '60 s', '0:15')] },
    ],
  },
  {
    id: 'p-advanced', name: 'Advanced Strength', level: 'Advanced', weeks: '10 weeks', daysPerWeek: 4, createdBy: 'John Smith', updated: new Date(2026, 6, 22), completion: 88,
    description: 'Percentage-based squat, bench and deadlift cycle with a test week at the end.', note: 'Run the week 10 test only with a trainer spotting.',
    days: [
      { name: 'Day 1', focus: 'Squat', exercises: [ex('Back Squat', 'Quads · Barbell', 5, '5 @ 80%', '180 s', '0:44'), ex('Pause Squat', 'Quads · Barbell', 3, '3', '150 s', '0:38'), ex('Bulgarian Split Squat', 'Legs · Dumbbell', 3, '8 / leg', '90 s', '0:35')] },
      { name: 'Day 2', focus: 'Bench', exercises: [ex('Bench Press', 'Chest · Barbell', 5, '5 @ 80%', '180 s', '0:45'), ex('Incline Bench', 'Upper chest · Barbell', 4, '6', '120 s', '0:37'), ex('Weighted Dips', 'Triceps · Bodyweight', 3, '8', '90 s', '0:41')] },
      { name: 'Day 3', focus: 'Deadlift', exercises: [ex('Deadlift', 'Posterior chain · Barbell', 5, '3 @ 85%', '180 s', '0:48'), ex('Deficit Deadlift', 'Back · Barbell', 3, '5', '150 s', '0:43'), ex('Back Extension', 'Lower back', 3, '12', '60 s', '0:24')] },
      { name: 'Day 4', focus: 'Accessories', exercises: [ex('Overhead Press', 'Shoulders · Barbell', 4, '6', '120 s', '0:39'), ex('Pendlay Row', 'Back · Barbell', 4, '8', '90 s', '0:34'), ex('Ab Wheel', 'Core', 3, '10', '60 s', '0:26')] },
    ],
  },
  {
    id: 'p-general', name: 'General Fitness', level: 'All levels', weeks: 'Ongoing', daysPerWeek: 3, createdBy: 'Aisha Khan', updated: new Date(2026, 8, 2), completion: 72,
    description: 'Three balanced sessions a week: strength, cardio and mobility. Good default for new members.', note: 'Swap any movement for a machine version if a member has pain.',
    days: [
      { name: 'Day 1', focus: 'Strength', exercises: [ex('Leg Press', 'Legs · Machine', 3, '12', '75 s', '0:34'), ex('Chest Press Machine', 'Chest · Machine', 3, '12', '60 s', '0:30'), ex('Seated Row', 'Back · Cable', 3, '12', '60 s', '0:31')] },
      { name: 'Day 2', focus: 'Cardio', exercises: [ex('Treadmill Intervals', 'Cardio', 6, '1 min fast', '1 min', '0:20'), ex('Cross Trainer', 'Cardio', 1, '15 min', '—', '0:18')] },
      { name: 'Day 3', focus: 'Mobility', exercises: [ex('Sun Salutation', 'Mobility', 3, '5 rounds', '30 s', '0:45'), ex('Hip Flow', 'Mobility', 1, '10 min', '—', '0:40'), ex('Bird Dog', 'Core', 3, '10 / side', '30 s', '0:22')] },
    ],
  },
];

export const MALE = ['Aarav', 'Aditya', 'Akash', 'Amit', 'Anand', 'Ankit', 'Arjun', 'Aryan', 'Ashish', 'Bhavin', 'Chirag', 'Darshan', 'Deepak', 'Dev', 'Dhruv', 'Gaurav', 'Harsh', 'Hardik', 'Ishaan', 'Jay', 'Jignesh', 'Kabir', 'Karan', 'Kunal', 'Manav', 'Manish', 'Mihir', 'Mohit', 'Nikhil', 'Nirav', 'Parth', 'Pranav', 'Rahul', 'Raj', 'Rohan', 'Sagar', 'Sahil', 'Sameer', 'Sanjay', 'Siddharth', 'Tushar', 'Varun', 'Vedant', 'Vikram', 'Vishal', 'Yash'];
export const FEMALE = ['Aanya', 'Aditi', 'Aishwarya', 'Ananya', 'Anjali', 'Bhavna', 'Dhwani', 'Diya', 'Esha', 'Heena', 'Isha', 'Ishita', 'Jhanvi', 'Kavya', 'Khushi', 'Kriti', 'Mansi', 'Meghna', 'Nandini', 'Neha', 'Nidhi', 'Pooja', 'Priya', 'Riddhi', 'Riya', 'Sakshi', 'Sanya', 'Shreya', 'Simran', 'Sneha', 'Tanvi', 'Trisha', 'Urvi', 'Vidhi', 'Zoya'];
export const SURNAMES = ['Mehta', 'Shah', 'Patel', 'Desai', 'Joshi', 'Iyer', 'Singh', 'Kapoor', 'Malhotra', 'Nair', 'Rao', 'Gupta', 'Kulkarni', 'Chauhan', 'Vora', 'Jain', 'Bhatt', 'Trivedi', 'Pandya', 'Parikh', 'Thakkar', 'Modi', 'Soni', 'Agarwal', 'Sharma', 'Verma', 'Reddy', 'Menon', 'Pillai', 'Khanna', 'Sheth', 'Dave', 'Vyas', 'Rana', 'Solanki', 'Chopra', 'Bose', 'Mukherjee', 'Kaur', 'Qureshi'];
