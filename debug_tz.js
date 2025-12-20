
const { toZonedTime } = require('date-fns-tz');

// 07:00 UTC = 08:00 Berlin
const utcStr = "2023-12-15T07:00:00.000Z";
const d = new Date(utcStr);

console.log("Original UTC:", d.toISOString());
console.log("Original getHours (Local):", d.getHours());
console.log("Original getUTCHours:", d.getUTCHours());

const zoned = toZonedTime(d, 'Europe/Berlin');
console.log("Zoned (shifted?):", zoned.toISOString());
console.log("Zoned getHours (Local):", zoned.getHours());
console.log("Zoned getUTCHours:", zoned.getUTCHours());
