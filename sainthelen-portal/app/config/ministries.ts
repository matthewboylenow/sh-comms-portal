export interface Ministry {
  id: string;
  name: string;
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
}

export const MINISTRIES: Ministry[] = [
  // Adult Discipleship Ministries (require approval)
  {
    id: 'adult-bible-study',
    name: 'Adult Bible Study',
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Weekly adult Bible study groups'
  },
  {
    id: 'adult-faith-formation',
    name: 'Adult Faith Formation',
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Adult spiritual growth and formation programs'
  },
  {
    id: 'adult-discipleship-retreat',
    name: 'Adult Discipleship Retreat',
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Retreats focused on adult spiritual development'
  },
  {
    id: 'mens-ministry',
    name: "Men's Ministry",
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Ministry focused on men\'s spiritual growth'
  },
  {
    id: 'womens-ministry',
    name: "Women's Ministry",
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Ministry focused on women\'s spiritual growth'
  },
  {
    id: 'small-groups',
    name: 'Small Groups',
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Adult small group Bible studies and fellowship'
  },
  {
    id: 'adult-education',
    name: 'Adult Education',
    requiresApproval: true,
    approvalCoordinator: 'adult-discipleship',
    description: 'Educational programs for adult spiritual development'
  },

  // Other Ministries (no approval required)
  {
    id: 'youth-ministry',
    name: 'Youth Ministry',
    requiresApproval: false,
    description: 'Programs for teenagers and high school students'
  },
  {
    id: 'childrens-ministry',
    name: "Children's Ministry",
    requiresApproval: false,
    description: 'Programs for children and elementary students'
  },
  {
    id: 'music-ministry',
    name: 'Music Ministry',
    requiresApproval: false,
    description: 'Choir, worship team, and music programs'
  },
  {
    id: 'outreach-ministry',
    name: 'Outreach Ministry',
    requiresApproval: false,
    description: 'Community outreach and service projects'
  },
  {
    id: 'missions',
    name: 'Missions',
    requiresApproval: false,
    description: 'Local and international mission work'
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    requiresApproval: false,
    description: 'Fellowship meals and welcoming ministries'
  },
  {
    id: 'prayer-ministry',
    name: 'Prayer Ministry',
    requiresApproval: false,
    description: 'Prayer groups and intercession'
  },
  {
    id: 'facilities',
    name: 'Facilities',
    requiresApproval: false,
    description: 'Building maintenance and facility management'
  },
  {
    id: 'stewardship',
    name: 'Stewardship',
    requiresApproval: false,
    description: 'Financial stewardship and giving programs'
  },
  {
    id: 'senior-ministry',
    name: 'Senior Ministry',
    requiresApproval: false,
    description: 'Programs for senior adults'
  },
  {
    id: 'communications',
    name: 'Communications',
    requiresApproval: false,
    description: 'Church communications and media'
  },
  {
    id: 'pastoral-care',
    name: 'Pastoral Care',
    requiresApproval: false,
    description: 'Care and support ministries'
  }
];

export const APPROVAL_COORDINATORS = {
  'adult-discipleship': {
    name: 'Coordinator of Adult Discipleship',
    email: process.env.ADULT_DISCIPLESHIP_COORDINATOR_EMAIL || ''
  }
};

export function getMinistryById(id: string): Ministry | undefined {
  return MINISTRIES.find(ministry => ministry.id === id);
}

export function getMinistryByName(name: string): Ministry | undefined {
  return MINISTRIES.find(ministry => 
    ministry.name.toLowerCase() === name.toLowerCase()
  );
}

export function getApprovalCoordinator(coordinatorId: string) {
  return APPROVAL_COORDINATORS[coordinatorId as keyof typeof APPROVAL_COORDINATORS];
}

export function searchMinistries(query: string): Ministry[] {
  if (!query) return MINISTRIES;
  
  const lowerQuery = query.toLowerCase();
  return MINISTRIES.filter(ministry =>
    ministry.name.toLowerCase().includes(lowerQuery) ||
    ministry.description?.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => {
    // Prioritize exact matches at the beginning
    const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery);
    const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return a.name.localeCompare(b.name);
  });
}