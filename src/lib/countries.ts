export interface Country {
  name: string;
  code: string;
  dialCode: string;
}

export const countries: Country[] = [
  { name: 'Qatar', code: 'QA', dialCode: '+974' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965' },
  { name: 'Oman', code: 'OM', dialCode: '+968' },
  { name: 'Jordan', code: 'JO', dialCode: '+962' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964' },
  { name: 'Morocco', code: 'MA', dialCode: '+212' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213' },
  { name: 'Libya', code: 'LY', dialCode: '+218' },
  { name: 'Sudan', code: 'SD', dialCode: '+249' },
  { name: 'Palestine', code: 'PS', dialCode: '+970' },
  { name: 'Syria', code: 'SY', dialCode: '+963' },
  { name: 'Yemen', code: 'YE', dialCode: '+967' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92' },
];
