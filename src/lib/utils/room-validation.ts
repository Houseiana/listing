interface RoomCounts {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateRoomCounts(counts: RoomCounts): ValidationResult {
  const errors: Record<string, string> = {};

  if (counts.bedrooms > counts.guests) {
    errors.bedrooms = 'Number of bedrooms cannot exceed guest capacity';
  }
  if (counts.beds > counts.guests) {
    errors.beds = 'Number of beds cannot exceed guest capacity';
  }
  if (counts.guests > counts.beds * 2) {
    errors.guests = `With ${counts.beds} beds, maximum capacity is ${counts.beds * 2} guests`;
  }
  if (counts.beds < counts.bedrooms) {
    errors.beds = 'Each bedroom must have at least one bed';
  }
  if (counts.bathrooms > 5) {
    errors.bathrooms = 'Maximum 5 bathrooms allowed';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
