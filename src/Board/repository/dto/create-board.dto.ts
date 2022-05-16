import { Transform } from "class-transformer";
import { IsDate, IsNotEmpty, IsNumber, Matches, MaxLength, MinLength, IsString } from 'class-validator';


export class CreateBoardDTO{
    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    @MaxLength(30,{message : "입력가능 글자 수를 초과하였습니다."})
    @IsString()
    @Matches(/^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/)
    title? : string;

    
    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    @MaxLength(200,{message : "입력가능 글자 수를 초과하였습니다."})
    @IsString()
    @Matches(/^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/)
    description? : string;

    
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    @IsString()
    content? : string;

    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    board_status? : number; 

    tag_name : string[];
    
}



export class CreateCommentDTO{

    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    board_id : number;

    
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    @IsString()
    content : string;

    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    comment_status : number;
    
}

export class CreateReCommentDTO{
    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    comment_id : number;

    
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    @IsString()
    content : string;

    @Transform((e)=> e.value.trim())
    @IsNotEmpty({message : "값이 입력되지 않았습니다."})
    recomment_status : number;
}

export class CreateLikesDTO{
    @Transform((e)=> e.value.trim())
    @IsNotEmpty()
    user_id : number;

    @Transform((e)=> e.value.trim())
    @IsNotEmpty()
    board_id : number;

    @Transform((e)=> e.value.trim())
    @IsNotEmpty()
    likes_status : number;
}