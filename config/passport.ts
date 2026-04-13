import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  type StrategyOptions,
} from "passport-jwt";
import User from "../models/user.model.js";
import "dotenv/config";

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_KEY as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  }),
);
