import { userStore } from '@/store/userStore';

export function generateUsernameFromBirthdate(birthdate: Date | string): string {
  const date = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  
  if (isNaN(date.getTime())) {
    throw new Error('유효하지 않은 생년월일입니다.');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const baseUsername = `${year}${month}${day}`;
  
  // Check for existing usernames and find the next available number
  const users = userStore.getUsers();
  const existingUsernames = users.map(u => u.username);
  
  if (!existingUsernames.includes(baseUsername)) {
    return baseUsername;
  }
  
  // Find the next available number
  let counter = 1;
  let candidateUsername = `${baseUsername}-${counter}`;
  
  while (existingUsernames.includes(candidateUsername)) {
    counter++;
    candidateUsername = `${baseUsername}-${counter}`;
  }
  
  return candidateUsername;
}

export function validateBirthdate(birthdate: Date | string): boolean {
  const date = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const now = new Date();
  const minDate = new Date('1900-01-01');
  
  return date >= minDate && date <= now;
}