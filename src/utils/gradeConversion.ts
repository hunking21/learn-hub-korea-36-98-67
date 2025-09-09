// Grade conversion utilities for legacy data migration

interface GradeConversionRule {
  pattern: RegExp;
  converter: (match: RegExpMatchArray) => string;
}

const CONVERSION_RULES: Record<string, GradeConversionRule[]> = {
  US: [
    {
      pattern: /^K$|^Kindergarten$/i,
      converter: () => 'GK'
    },
    {
      pattern: /^(\d+)(?:st|nd|rd|th)$/,
      converter: (match) => `G${match[1]}`
    },
    {
      pattern: /^Grade\s*(\d+)$/i,
      converter: (match) => `G${match[1]}`
    }
  ],
  UK: [
    {
      pattern: /^Year\s*(\d+)$/i,
      converter: (match) => `Yr${match[1]}`
    }
  ],
  KR: [] // Korean grades are already in correct format
};

/**
 * Convert legacy grade notation to new standardized format
 */
export function convertGradeNotation(grade: string, system: string): string {
  if (!grade || !system) return grade;

  const systemRules = CONVERSION_RULES[system.toUpperCase()];
  if (!systemRules) return grade;

  for (const rule of systemRules) {
    const match = grade.match(rule.pattern);
    if (match) {
      return rule.converter(match);
    }
  }

  return grade; // Return original if no conversion rule matches
}

/**
 * Convert legacy system notation to new format
 */
export function convertSystemNotation(system: string): string {
  if (!system) return system;

  const systemMap: Record<string, string> = {
    'korea': 'KR',
    'korean': 'KR',
    'us': 'US',
    'usa': 'US',
    'american': 'US',
    'uk': 'UK',
    'british': 'UK',
    'britain': 'UK'
  };

  const normalized = system.toLowerCase();
  return systemMap[normalized] || system;
}

/**
 * Migrate user data with legacy grade/system notation to new format
 */
export function migrateUserGradeData(user: any): any {
  if (!user) return user;

  let updatedUser = { ...user };
  let needsUpdate = false;

  // Convert system notation if needed
  if (user.system) {
    const convertedSystem = convertSystemNotation(user.system);
    if (convertedSystem !== user.system) {
      updatedUser.system = convertedSystem;
      needsUpdate = true;
    }
  }

  // Convert grade notation if needed
  if (user.grade && user.system) {
    const convertedGrade = convertGradeNotation(user.grade, updatedUser.system);
    if (convertedGrade !== user.grade) {
      updatedUser.grade = convertedGrade;
      needsUpdate = true;
    }
  }

  return { user: updatedUser, needsUpdate };
}

/**
 * Batch migrate all users with legacy data
 */
export function batchMigrateUsers(users: any[]): { users: any[]; migrationCount: number } {
  let migrationCount = 0;
  
  const migratedUsers = users.map(user => {
    const { user: migratedUser, needsUpdate } = migrateUserGradeData(user);
    if (needsUpdate) {
      migrationCount++;
    }
    return migratedUser;
  });

  return { users: migratedUsers, migrationCount };
}