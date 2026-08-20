export const COURSES = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'BCA', 'BBA', 'B.Sc', 'Other'];

export const BRANCHES_MAP: Record<string, { value: string; label: string }[]> = {
  'B.Tech': [
    { value: 'CSE', label: 'CSE' },
    { value: 'CS', label: 'CS (Computer Science)' },
    { value: 'CSBS', label: 'CSBS (CS & Business Systems)' },
    { value: 'IT', label: 'IT (Information Technology)' },
    { value: 'ECE', label: 'ECE (Electronics & Comm. Engineering)' },
    { value: 'ME', label: 'ME (Mechanical Engineering)' },
    { value: 'BT', label: 'BT (Biotechnology)' },
    { value: 'MnC', label: 'MnC (Mathematics & Computing)' },
    { value: 'Other', label: 'Other' }
  ],
  'M.Tech': [
    { value: 'CSE', label: 'CSE' },
    { value: 'ECE', label: 'ECE' },
    { value: 'ME', label: 'ME' },
    { value: 'BT', label: 'BT' },
    { value: 'Other', label: 'Other' }
  ],
  'BCA': [
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other' }
  ],
  'BBA': [
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other' }
  ],
  'MBA': [
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other' }
  ],
  'MCA': [
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other' }
  ],
  'B.Sc': [
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other' }
  ],
  'Other': [
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other' }
  ]
};

export const CSE_SPECIALIZATIONS = [
  { value: 'Core', label: 'Core / General' },
  { value: 'AIML', label: 'AIML (AI & Machine Learning)' },
  { value: 'AI', label: 'AI (Artificial Intelligence)' },
  { value: 'DS', label: 'DS (Data Science)' },
  { value: 'CS', label: 'CS (Cyber-Security)' },
  { value: 'IoT', label: 'IoT (Internet of Things)' },
  { value: 'Regional', label: 'Regional' },
  { value: 'Working Professionals', label: 'Working Professionals (WP)' },
  { value: 'Twinning', label: 'Twinning Program' },
  { value: 'AI Twinning', label: 'AI/International Twinning' },
  { value: 'AIML Twinning', label: 'AIML/International Twinning' },
  { value: 'Other', label: 'Other' }
];

export const CAMPUS_LOCATIONS = [
  'NIET Plot 19',
  'NIET Plot 15',
  'NIET Plot 14'
];
