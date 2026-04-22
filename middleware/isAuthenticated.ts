import passport from "passport";

// এই একটি লাইনই আপনার বড় পাসপোর্ট ফাংশনটিকে 'isAuthenticated' নামে সেভ করে রাখবে
export const isAuthenticated = passport.authenticate("jwt", { session: false });

