import { ConsoleLogger, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Board } from '../repository/entity/board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { BoardRepository } from '../repository/board.repository';
import { CreateBoardDTO } from '../repository/dto/create-board.dto';
import { UpdateBoardDTO } from '../repository/dto/update-board.dto';
import { Tag } from '../repository/entity/tag.entity';
import { TagRepository } from '../repository/tag.repository';
import { isEmpty, IsNotEmpty } from 'class-validator';
import { Likes } from '../repository/entity/like.entity';
import { Repository, Like, In } from 'typeorm';
import { Users } from 'src/users/entity/user.entity';

@Injectable()
export class BoardService {
    constructor(
        @InjectRepository(BoardRepository)
        private boardRepository : BoardRepository,
        @InjectRepository(TagRepository)
        private tagRepository : TagRepository,
        @InjectRepository(Likes) 
        private likesRepository : Repository<Likes>,
        @InjectRepository(Users)
        private usersRepository : Repository<Users>

    ){}
    
    
    /**
     * createBoard(게시글 생성 함수)
     * @param createBoardDTO 
     * @param file 
     * @returns void
     */
    async createBoard(createBoardDTO : CreateBoardDTO,writer:number, file) : Promise <void>{
        //file upload
        let uploadPath = "";
        if(!(file === undefined)){
            const fileName = Date.now() + file.originalname;
            uploadPath = `C:/File/baobabnamu/upload/${fileName}`;
            fs.writeFileSync(uploadPath, file.buffer);
        }        
        //board 생성
        const board = await this.boardRepository.createBoard(createBoardDTO,writer,uploadPath);
        
        if(board === undefined){
            throw new HttpException('게시판 생성 실패', HttpStatus.CONFLICT)
        }
        
        
        //tag 생성
        if(!(createBoardDTO.tag_name === undefined)){
            if(createBoardDTO.tag_name.length > 0){
                await this.createTag(board.id, createBoardDTO.tag_name);
            }
            
        }
        

    }
    
    /**
     * getBoardMain(메인페이지 호출 함수)
     * @param id 
     * @returns Board[]
     */
    async getBoardMain(page:number, login_id? : number) : Promise<Board[]> {

        //status공개 
        const status : number[]  = [0] ;

        //페이지네이션
        const limit : number  = 15 ; 
        const pageVale : number = typeof page == typeof {} ?Number(Object.values(page)[0]) : Number(page);
        const skip : number  = pageVale * limit;
        const take : number = skip + limit;

        //페이지 호출
        const board = await this.boardRepository.getBoardMain(skip,take,status,login_id == undefined? -1 : login_id);
        /*
        const board = await this.boardRepository.find({
        
            select : ["id","title","description","content","writer","thumbnail","views","date","board_status","likes_count"],
            where : {board_status : status},
            relations : ["tags"],
            skip : skip,
            take : take

        })
        */
        
        

        return board;
    }
    /**
     * getBoardPersonal(개인페이지 호출 함수)
     * @param page 
     * @param writer 
     * @returns 
     */
     async getBoardPersonal(page:number, writer : number) : Promise<Board[]> {

        //status 공개, 비공개
        const status : number[]  = [0,2] ;
        
        //페이지네이션
        const limit : number = 15 ; 
        const pageVale : number = typeof page == typeof {} ?Number(Object.values(page)[0]) : Number(page);
        const skip : number  = pageVale * limit;
        const take : number = skip + limit;

        const board = await this.boardRepository.getBoardPersonal(skip, take,writer, status)


        return board;
        //this.getBoardById(id);
        //const board = await this.boardRepository.getBoardMain(id);
        /*
        const board = await this.boardRepository.find({
            
            select : ["id","title","description","content","thumbnail","views","date","board_status","likes_count"],
            where : {board_status : In(status), writer : writer},
            relations : ["tags"],
            skip : skip,
            take : take

        })
        */
        
        
    }
    /**
     * getBoardGuest(게스트용 개인페이지 호출 함수)
     * @param page 
     * @param writer 
     * @returns 
     */
    async getBoardGuest(page:number, writer : number, login_id? : number) : Promise<Board[]> {
        //status 공개
        const status : number[] = [0] ;

        //페이지네이션
        const limit : number = 15 ; 
        const pageVale : number = typeof page == typeof {} ?Number(Object.values(page)[0]) : Number(page);
        const skip : number= pageVale * limit;
        const take : number = skip + limit;
        
        const board = await this.boardRepository.getBoardGuest(skip, take,writer, status,login_id == undefined? -1 : login_id)
        /*
        const board = await this.boardRepository.find({
        
            select : ["id","title","description","content","thumbnail","views","date","board_status","likes_count"],
            where : {board_status : status, writer : writer},
            relations : ["tags"],
            skip : skip,
            take : take

        })
        */
        return board;
    }

    
    /**
     * getBoardPersonalTag(개인페이지 태그 검색API)
     * @param page 
     * @param writer 
     * @param tag_name
     * @returns 
     */
    async getBoardPersonalTag(page:number, writer : number, tag_name : string[]):Promise<Board[]>{
        const status : number[]  = [0,2] ;
        
        const limit : number = 15 ; 
        const pageVale : number = typeof page == typeof {} ?Number(Object.values(page)[0]) : Number(page);
        const skip : number= pageVale * limit;
        const take : number = skip + limit;

        const board = await this.boardRepository.getBoardPersonalTag(skip, take, writer, tag_name, status);

        return board;
    }

    /**
     * getBoardGuestTag(게스트 페이지 태그 검색API)
     * @param page 
     * @param writer 
     * @param tag_name
     * @returns 
     */
     async getBoardGuestTag(page:number, writer : number, tag_name : string[], login_id? : number):Promise<Board[]>{
        const status : number[]  = [0] ;
        
        //페이지네이션
        const limit : number = 15 ; 
        const pageVale : number = typeof page == typeof {} ?Number(Object.values(page)[0]) : Number(page);
        const skip : number= pageVale * limit;
        const take : number = skip + limit;
        
        const board = await this.boardRepository.getBoardGuestTag(skip, take, writer, tag_name, status,login_id == undefined? -1 : login_id);


        return board;
    }


    /**
     * getBoardById(상세페이지 호출 함수)
     * @param id 
     * @returns 
     */
    async getBoardById(id : number , login_id? : number) : Promise<Board>{

        const idValue :number = typeof id == typeof {} ?Number(Object.values(id)[0]) : Number(id);
        
        const status : number = 0;

        const board = await this.boardRepository.getBoardView(id,login_id == undefined? -1 : login_id);
        /*
        const board = await this.boardRepository.findOne(
            {
                select : ["id","title","description","content","thumbnail","views","date","board_status","likes_count"],
                relations : ["tags"],
                where : {board_status : status, id:`${idValue}`}
                
            }
        );
        */

        if(board === undefined){
            throw new HttpException('게시물 호출 실패', HttpStatus.CONFLICT);
        }
        /*
            상세페이지 이전글 이후글
            const beforeBoard = await this.boardRepository.findOne(id-1);
            const afterBoard = await this.boardRepository.findOne(id+1);
            
            let board ;
            if(isEmpty(beforeBoard)){
                board = {"beforBoardTitle" : `definedBoard`}
                Object.assign(found,board)
            }else{
                board = {"beforBoardTitle" : `${beforeBoard.title}`};
                Object.assign(found,board)
            }
            if(isEmpty(afterBoard)){
                board = {"afterBoardTitle" : `definedBoard`}
                Object.assign(found,board)
            }else{
                board = {"afterBoardTitle" : `${afterBoard.title}`};
                Object.assign(found,board)
            }
        */
        

        return board;
    }
    
    /**
     * updateBoard(게시물 수정 함수)
     * @param id 
     * @param UpdateBoardDTO 
     * @returns void
     */
    async updateBoard(UpdateBoardDTO:UpdateBoardDTO, id :number) : Promise<void>{
        
        const idValue :number = typeof id == typeof {} ?Number(Object.values(id)[0]) : Number(id);
        
        let board = await this.boardRepository.findOne({
            where : {id : idValue}
        });
        if(UpdateBoardDTO.title!=undefined){
            board.title = UpdateBoardDTO.title;
        }if(UpdateBoardDTO.description!=undefined){
            board.description = UpdateBoardDTO.description;
        }if(UpdateBoardDTO.content!=undefined){
            board.content = UpdateBoardDTO.content;
        }if(UpdateBoardDTO.board_status != undefined){
            board.board_status = UpdateBoardDTO.board_status;
        }

        //태그 수정
        if(UpdateBoardDTO.tag_name!=undefined){
            if(UpdateBoardDTO.tag_name.length > 0){
                    const tags_id = await this.tagRepository.find({board_id : Number(idValue)})
                
                    await this.tagRepository.delete({board_id : Number(idValue)});
                    
                    const tag = this.createTag(id,UpdateBoardDTO.tag_name);
                }
            }
        await this.boardRepository.save(board);
        
        
        
        
        
        
    }
    /**
     * deleteBoard(게시물 삭제 함수)
     * @param id 
     */
    async deleteBoard(id : number) : Promise<void> {
        const idValue :number = typeof id == typeof {} ?Number(Object.values(id)[0]) : Number(id);
        
        await this.tagRepository.delete({board_id : Number(idValue)});
                
        const board = await this.boardRepository.deleteBoardById(id);

    }

    //내부 사용 함수

    /**
     * viewUp(조회수 증가 함수)
     * @param id 
     * @returns void
     */
    public async viewUp(id : number) : Promise<void>{
        const board = await this.boardRepository.findOne(id);
        board.views += 1;
        await this.boardRepository.save(board);
        
    }

    /**
     * createTag(태그 생성 함수)
     * @param id 
     * @param tags_name 
     * @return void
     */
    private async createTag(id : number, tags_name) : Promise<void>{
        const idValue :number = typeof id == typeof {} ?Number(Object.values(id)[0]) : Number(id);
        
        const board_id : number = idValue;
        let tag ;
        if(tags_name != undefined){
            if(tags_name.length > 0 ){
                const tags : string[] = tags_name;
                
                for(const tag_name of tags_name){
                    tag = await this.tagRepository.createTag(board_id, tag_name);
                }
            }
        }
        
    }
    
    public async tagCount(writer : number){
        const board_id = await this.getBoardByUserId(writer);
        
        if(board_id.length > 0){
            return await this.tagRepository.tagCount(board_id);
        }
        return ;
       
    }

    /**
     * getBoardByUserId()
     * @param writer 
     * @returns 
     */
    async getBoardByUserId(writer : number) : Promise<number[]>{
        const board =await this.boardRepository.find({
            select : ["id"],
            where : {writer}
        })
        let board_id = [];
        if(board.length > 0){
            board.forEach((e)=>{
                board_id.push(e.id);
            });
        }
        
        return board_id;
    }

    /**
     * CheckingWriter(게시판에 관한 유저 권한 확인 함수)
     * @param id 
     * @param writer 
     * @returns 
     */
    async CheckingWriter(id: number, writer : number){
        const board_id : number[]= await this.getBoardByUserId(writer);
        const idValue :number = typeof id == typeof {} ?Number(Object.values(id)[0]) : Number(id);
        
        if(!(board_id.indexOf(idValue)>-1)){
            throw new HttpException('권한이 없는 사용자입니다.', HttpStatus.CONFLICT)
        }
        
        return id;
    }
    
    /**
     * 좋아오 생성 함수
     * @param board_id 
     * @param user_id 
     */
    async LikeBoard(board_id : number, user_id : number){
        const idValue :number = typeof board_id == typeof {} ?Number(Object.values(board_id)[0]) : Number(board_id);
        
        const liked = await this.likesRepository.findOne({
            where : {board_id : idValue, user_id : user_id}
        })
        const board = await this.boardRepository.findOne({
            where : { id : idValue}
        })
        const likes_status = 1;
        if(!(liked)){
            const like = await this.likesRepository.create({
                likes_status,
                board_id,
                user_id
            })
            board.likes_count++;
            await this.likesRepository.save(like);
            await this.boardRepository.save(board);
        }else if(liked.likes_status == 0){
            liked.likes_status = 1;
            board.likes_count++;
            await this.likesRepository.save(liked);
            await this.boardRepository.save(board);
        }else if (liked.likes_status == 1){
            liked.likes_status = 0;
            board.likes_count--;
            await this.likesRepository.save(liked);
            await this.boardRepository.save(board);
        }


    }

    /**
     * CheckBoardById(아이디 유무 확인 함수)
     * @param id 
     * @returns 
     */
    async CheckBoardById(id : number) : Promise<void>{
        if(id == undefined){
            throw new HttpException('ID 입력을 잘못 하였습니다.', HttpStatus.CONFLICT)
        }



        const cehckedboard = await this.boardRepository.findOne(id);
        
        if(!cehckedboard){
            throw new HttpException('존재하지 않는 게시물 입니다.', HttpStatus.CONFLICT)
        }
    }
    /**
     * userIdInCookie(쿠키 Access 토큰의 user_id 반환)
     * @param accessToken 
     * @returns 
     */
    async userIdInCookie(accessToken : string) : Promise<number>{
        const accessTokken = accessToken;
        const base64Payload = accessTokken.split('.')[1]; 
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        const user_id_inPayload : number = payload.id;

        return user_id_inPayload ;
    }

    async getUserById(id : number) : Promise<Users>{
        

        const user = await this.usersRepository.findOne({
            select : ["id","userid","username","email","role","avatar_image","description"],
            where : {
                id : id
            }
        })

        if(!user ){
            throw new HttpException('해당 유저가 존재하지 않습니다.', HttpStatus.CONFLICT)
        }
 

        return user;

    }
    
    
}
