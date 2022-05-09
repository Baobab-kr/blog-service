import { Injectable } from "@nestjs/common";
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { PassportStrategy } from "@nestjs/passport";
import { Payload } from "./payload.interface";
import { UsersService } from "src/users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
  constructor(
    private usersService: UsersService
  ) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: true,
        secretOrKey: 'SECRET',
    })
  }

  async validate(payload: Payload, done: VerifiedCallback): Promise<any> {
    const user = await this.usersService.tokenValidateUser(payload);
    return done(null, user);
  }
}