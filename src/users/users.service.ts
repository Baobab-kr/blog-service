import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Payload } from 'src/auth/security/payload.interface';
import { EmailService } from 'src/email/email.service';
import { Repository, Connection } from 'typeorm';
import { SavedUserDto } from './dto/saved-user.dto';
import { Users } from './entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private emailService:EmailService,
    private authService:AuthService,
    @InjectRepository(Users) private usersRepository:Repository<Users>,
    private connection: Connection,
    ) {};

  async createUser(userid: string, email: string, username: string, password: string, inputVerifyCode: number) {
    await this.checkUserIdExists(userid);
    await this.checkUserNameExists(username);
    await this.checkEmailExists(email);
    await this.checkMemberJoinEmail(username, inputVerifyCode);
    await this.saveUserUsingQueryRunnner(userid, email, username, password);
  }

  async login(userid: string, password: string): Promise<{accessToken: string} | undefined>  {
    const savedUserInfo: SavedUserDto = await this.getUserInfo(userid);
    await this.validateUser(password, savedUserInfo.password);
    const jwt = await this.authService.createJwtToken(savedUserInfo);
    return jwt;
  }

  
  async checkUserIdExists(userid: string) {
    const userIdValue: string = typeof userid !== typeof "" ? Object.values(userid)[0] : userid
    const user = await this.usersRepository.findOne({userid: userIdValue});
    if(user !== undefined) {
      throw new HttpException('Duplicated UserID', HttpStatus.CONFLICT)
    } else {
      return '사용 가능한 아이디 입니다.'
    }
  }
  
  async checkEmailExists(email: string) {
    const emailValue: string = typeof email !== typeof "" ? Object.values(email)[0] : email
    const user = await this.usersRepository.findOne({email: emailValue});
    if(user !== undefined) {
      throw new HttpException('Duplicated E-Mail Address', HttpStatus.CONFLICT)
    } else {
      return '사용 가능한 메일 주소 입니다.'
    }
  }
  
  public async checkUserNameExists(username: string) {
    const userNameValue: string = typeof username !== typeof "" ? Object.values(username)[0] : username
    const user = await this.usersRepository.findOne({username: userNameValue});
    if(user !== undefined) {
      throw new HttpException('Duplicated Username', HttpStatus.CONFLICT)
    } else {
      return '사용 가능한 유저 이름 입니다.'
    }
  }
  
  
  private async saveUserUsingQueryRunnner(userid: string,  email: string, username: string, password: string) {
    const queryRunner = this.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = new Users();
      user.userid = userid
      user.email = email
      user.username = username
      user.password = await this.authService.encrpytionPassword(password)
      await this.usersRepository.save(user)
      
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
  
  private async createVerifyCode(): Promise<number> {
    const verifyCode = Math.floor(Math.random() * 1000000);
    return verifyCode;
  }
  
  async sendMemberJoinEmail(email: string, username: string) {
    const verifyCode: number = await this.createVerifyCode();
    await this.emailService.sendMemberJoinVerification(email, username, verifyCode);
  }
  
  private async checkMemberJoinEmail(username: string, inputVerifyCode: number):Promise<void> {
    await this.authService.checkVerifyCode(username, inputVerifyCode);
  }

  async getUserInfo(userid: string):Promise<SavedUserDto> {
    const user = await this.usersRepository.findOne({userid});
    if(user === undefined) {
      throw new HttpException('Invalid UserID', HttpStatus.UNAUTHORIZED)
    }
    return user;
  }

  async validateUser(inputPassword: string, savedPassword: string) {
    const valid = await this.authService.comparePassword(inputPassword, savedPassword);
    if(!valid) {
      throw new HttpException('Invalid Password', HttpStatus.UNAUTHORIZED)
    } 
  }

  async tokenValidateUser(payload: Payload) {
    const username = payload.username;
    const userInfo = await this.usersRepository.findOne({username});
    if(!userInfo) {
      throw new HttpException('User Does Not Exist.', HttpStatus.UNAUTHORIZED)
    } 
    return userInfo;
  }
}
