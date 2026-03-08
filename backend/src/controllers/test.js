import bcrypt from 'bcryptjs';

const c = await bcrypt.hash("daddy", 14)
console.log(c)
