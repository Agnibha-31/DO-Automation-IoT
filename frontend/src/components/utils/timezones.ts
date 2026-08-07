export interface Timezone {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const timezones: Timezone[] = [
  // UTC-12
  { value: "Pacific/Baker_Island", label: "Baker Island Time", offset: "UTC-12", region: "Pacific" },
  
  // UTC-11
  { value: "Pacific/Midway", label: "Samoa Standard Time", offset: "UTC-11", region: "Pacific" },
  { value: "Pacific/Niue", label: "Niue Time", offset: "UTC-11", region: "Pacific" },
  
  // UTC-10
  { value: "Pacific/Honolulu", label: "Hawaii Standard Time", offset: "UTC-10", region: "Pacific" },
  { value: "Pacific/Tahiti", label: "Tahiti Time", offset: "UTC-10", region: "Pacific" },
  
  // UTC-9:30
  { value: "Pacific/Marquesas", label: "Marquesas Time", offset: "UTC-9:30", region: "Pacific" },
  
  // UTC-9
  { value: "America/Anchorage", label: "Alaska Standard Time", offset: "UTC-9", region: "America" },
  { value: "Pacific/Gambier", label: "Gambier Time", offset: "UTC-9", region: "Pacific" },
  
  // UTC-8
  { value: "America/Los_Angeles", label: "Pacific Standard Time", offset: "UTC-8", region: "America" },
  { value: "America/Vancouver", label: "Pacific Standard Time (Vancouver)", offset: "UTC-8", region: "America" },
  { value: "America/Tijuana", label: "Pacific Standard Time (Tijuana)", offset: "UTC-8", region: "America" },
  
  // UTC-7
  { value: "America/Denver", label: "Mountain Standard Time", offset: "UTC-7", region: "America" },
  { value: "America/Phoenix", label: "Mountain Standard Time (Arizona)", offset: "UTC-7", region: "America" },
  { value: "America/Calgary", label: "Mountain Standard Time (Calgary)", offset: "UTC-7", region: "America" },
  
  // UTC-6
  { value: "America/Chicago", label: "Central Standard Time", offset: "UTC-6", region: "America" },
  { value: "America/Mexico_City", label: "Central Standard Time (Mexico)", offset: "UTC-6", region: "America" },
  { value: "America/Winnipeg", label: "Central Standard Time (Winnipeg)", offset: "UTC-6", region: "America" },
  
  // UTC-5
  { value: "America/New_York", label: "Eastern Standard Time", offset: "UTC-5", region: "America" },
  { value: "America/Toronto", label: "Eastern Standard Time (Toronto)", offset: "UTC-5", region: "America" },
  { value: "America/Havana", label: "Cuba Standard Time", offset: "UTC-5", region: "America" },
  { value: "America/Lima", label: "Peru Time", offset: "UTC-5", region: "America" },
  
  // UTC-4
  { value: "America/Halifax", label: "Atlantic Standard Time", offset: "UTC-4", region: "America" },
  { value: "America/Caracas", label: "Venezuela Time", offset: "UTC-4", region: "America" },
  { value: "America/Santiago", label: "Chile Standard Time", offset: "UTC-4", region: "America" },
  { value: "America/La_Paz", label: "Bolivia Time", offset: "UTC-4", region: "America" },
  
  // UTC-3:30
  { value: "America/St_Johns", label: "Newfoundland Standard Time", offset: "UTC-3:30", region: "America" },
  
  // UTC-3
  { value: "America/Sao_Paulo", label: "Brasília Time", offset: "UTC-3", region: "America" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina Time", offset: "UTC-3", region: "America" },
  { value: "America/Montevideo", label: "Uruguay Standard Time", offset: "UTC-3", region: "America" },
  
  // UTC-2
  { value: "America/Noronha", label: "Fernando de Noronha Time", offset: "UTC-2", region: "America" },
  { value: "Atlantic/South_Georgia", label: "South Georgia Time", offset: "UTC-2", region: "Atlantic" },
  
  // UTC-1
  { value: "Atlantic/Azores", label: "Azores Standard Time", offset: "UTC-1", region: "Atlantic" },
  { value: "Atlantic/Cape_Verde", label: "Cape Verde Time", offset: "UTC-1", region: "Atlantic" },
  
  // UTC+0
  { value: "UTC", label: "Coordinated Universal Time", offset: "UTC+0", region: "UTC" },
  { value: "Europe/London", label: "Greenwich Mean Time", offset: "UTC+0", region: "Europe" },
  { value: "Africa/Casablanca", label: "Western European Time", offset: "UTC+0", region: "Africa" },
  { value: "Atlantic/Reykjavik", label: "Greenwich Mean Time (Iceland)", offset: "UTC+0", region: "Atlantic" },
  
  // UTC+1
  { value: "Europe/Paris", label: "Central European Time", offset: "UTC+1", region: "Europe" },
  { value: "Europe/Berlin", label: "Central European Time (Berlin)", offset: "UTC+1", region: "Europe" },
  { value: "Europe/Rome", label: "Central European Time (Rome)", offset: "UTC+1", region: "Europe" },
  { value: "Africa/Lagos", label: "West Africa Time", offset: "UTC+1", region: "Africa" },
  
  // UTC+2
  { value: "Europe/Helsinki", label: "Eastern European Time", offset: "UTC+2", region: "Europe" },
  { value: "Europe/Athens", label: "Eastern European Time (Athens)", offset: "UTC+2", region: "Europe" },
  { value: "Africa/Cairo", label: "Eastern European Time (Cairo)", offset: "UTC+2", region: "Africa" },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time", offset: "UTC+2", region: "Africa" },
  
  // UTC+3
  { value: "Europe/Moscow", label: "Moscow Standard Time", offset: "UTC+3", region: "Europe" },
  { value: "Asia/Baghdad", label: "Arabia Standard Time", offset: "UTC+3", region: "Asia" },
  { value: "Africa/Nairobi", label: "East Africa Time", offset: "UTC+3", region: "Africa" },
  { value: "Asia/Riyadh", label: "Arabia Standard Time (Riyadh)", offset: "UTC+3", region: "Asia" },
  
  // UTC+3:30
  { value: "Asia/Tehran", label: "Iran Standard Time", offset: "UTC+3:30", region: "Asia" },
  
  // UTC+4
  { value: "Asia/Dubai", label: "Gulf Standard Time", offset: "UTC+4", region: "Asia" },
  { value: "Asia/Baku", label: "Azerbaijan Time", offset: "UTC+4", region: "Asia" },
  { value: "Europe/Samara", label: "Samara Time", offset: "UTC+4", region: "Europe" },
  
  // UTC+4:30
  { value: "Asia/Kabul", label: "Afghanistan Time", offset: "UTC+4:30", region: "Asia" },
  
  // UTC+5
  { value: "Asia/Karachi", label: "Pakistan Standard Time", offset: "UTC+5", region: "Asia" },
  { value: "Asia/Tashkent", label: "Uzbekistan Time", offset: "UTC+5", region: "Asia" },
  { value: "Asia/Yekaterinburg", label: "Yekaterinburg Time", offset: "UTC+5", region: "Asia" },
  
  // UTC+5:30
  { value: "Asia/Kolkata", label: "India Standard Time", offset: "UTC+5:30", region: "Asia" },
  { value: "Asia/Colombo", label: "Sri Lanka Standard Time", offset: "UTC+5:30", region: "Asia" },
  
  // UTC+5:45
  { value: "Asia/Kathmandu", label: "Nepal Time", offset: "UTC+5:45", region: "Asia" },
  
  // UTC+6
  { value: "Asia/Dhaka", label: "Bangladesh Standard Time", offset: "UTC+6", region: "Asia" },
  { value: "Asia/Almaty", label: "Almaty Time", offset: "UTC+6", region: "Asia" },
  { value: "Asia/Omsk", label: "Omsk Time", offset: "UTC+6", region: "Asia" },
  
  // UTC+6:30
  { value: "Asia/Yangon", label: "Myanmar Time", offset: "UTC+6:30", region: "Asia" },
  { value: "Indian/Cocos", label: "Cocos Islands Time", offset: "UTC+6:30", region: "Indian" },
  
  // UTC+7
  { value: "Asia/Bangkok", label: "Indochina Time", offset: "UTC+7", region: "Asia" },
  { value: "Asia/Jakarta", label: "Western Indonesian Time", offset: "UTC+7", region: "Asia" },
  { value: "Asia/Ho_Chi_Minh", label: "Indochina Time (Vietnam)", offset: "UTC+7", region: "Asia" },
  { value: "Asia/Krasnoyarsk", label: "Krasnoyarsk Time", offset: "UTC+7", region: "Asia" },
  
  // UTC+8
  { value: "Asia/Shanghai", label: "China Standard Time", offset: "UTC+8", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore Standard Time", offset: "UTC+8", region: "Asia" },
  { value: "Asia/Manila", label: "Philippine Standard Time", offset: "UTC+8", region: "Asia" },
  { value: "Australia/Perth", label: "Australian Western Standard Time", offset: "UTC+8", region: "Australia" },
  { value: "Asia/Irkutsk", label: "Irkutsk Time", offset: "UTC+8", region: "Asia" },
  
  // UTC+8:45
  { value: "Australia/Eucla", label: "Australian Central Western Standard Time", offset: "UTC+8:45", region: "Australia" },
  
  // UTC+9
  { value: "Asia/Tokyo", label: "Japan Standard Time", offset: "UTC+9", region: "Asia" },
  { value: "Asia/Seoul", label: "Korea Standard Time", offset: "UTC+9", region: "Asia" },
  { value: "Asia/Yakutsk", label: "Yakutsk Time", offset: "UTC+9", region: "Asia" },
  { value: "Pacific/Palau", label: "Palau Time", offset: "UTC+9", region: "Pacific" },
  
  // UTC+9:30
  { value: "Australia/Adelaide", label: "Australian Central Standard Time", offset: "UTC+9:30", region: "Australia" },
  { value: "Australia/Darwin", label: "Australian Central Standard Time (Darwin)", offset: "UTC+9:30", region: "Australia" },
  
  // UTC+10
  { value: "Australia/Sydney", label: "Australian Eastern Standard Time", offset: "UTC+10", region: "Australia" },
  { value: "Australia/Melbourne", label: "Australian Eastern Standard Time (Melbourne)", offset: "UTC+10", region: "Australia" },
  { value: "Pacific/Guam", label: "Chamorro Standard Time", offset: "UTC+10", region: "Pacific" },
  { value: "Asia/Vladivostok", label: "Vladivostok Time", offset: "UTC+10", region: "Asia" },
  
  // UTC+10:30
  { value: "Australia/Lord_Howe", label: "Lord Howe Standard Time", offset: "UTC+10:30", region: "Australia" },
  
  // UTC+11
  { value: "Pacific/Noumea", label: "New Caledonia Time", offset: "UTC+11", region: "Pacific" },
  { value: "Asia/Magadan", label: "Magadan Time", offset: "UTC+11", region: "Asia" },
  { value: "Pacific/Norfolk", label: "Norfolk Island Time", offset: "UTC+11", region: "Pacific" },
  
  // UTC+12
  { value: "Pacific/Auckland", label: "New Zealand Standard Time", offset: "UTC+12", region: "Pacific" },
  { value: "Pacific/Fiji", label: "Fiji Time", offset: "UTC+12", region: "Pacific" },
  { value: "Asia/Kamchatka", label: "Kamchatka Time", offset: "UTC+12", region: "Asia" },
  
  // UTC+12:45
  { value: "Pacific/Chatham", label: "Chatham Standard Time", offset: "UTC+12:45", region: "Pacific" },
  
  // UTC+13
  { value: "Pacific/Tongatapu", label: "Tonga Time", offset: "UTC+13", region: "Pacific" },
  { value: "Pacific/Apia", label: "West Samoa Time", offset: "UTC+13", region: "Pacific" },
  
  // UTC+14
  { value: "Pacific/Kiritimati", label: "Line Islands Time", offset: "UTC+14", region: "Pacific" }
];

export const findTimezoneByValue = (value: string): Timezone | undefined => {
  return timezones.find(tz => tz.value === value);
};

export const getTimezonesByRegion = (region: string): Timezone[] => {
  return timezones.filter(tz => tz.region === region);
};

export const getAllRegions = (): string[] => {
  const regions = new Set(timezones.map(tz => tz.region));
  return Array.from(regions).sort();
};