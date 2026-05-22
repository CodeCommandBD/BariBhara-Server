import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt, } from "passport-jwt";
import User from "../models/user.model.js";
import "dotenv/config";
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY,
};
passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    }
    catch (error) {
        return done(error, false);
    }
}));
//# sourceMappingURL=passport.js.map