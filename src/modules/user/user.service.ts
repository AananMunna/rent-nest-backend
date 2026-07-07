import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { RegisterUserPayload } from "./user.interface";

const registerUserIntoDB = async (payload: RegisterUserPayload) =>{
    const { name, email, password, role, phone, avatarUrl, address, bio } = payload;
    const isUserExist = await prisma.user.findUnique({
        where: { email }
    })

    if (isUserExist) {
        throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds))

    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role ?? "TENANT",
            phone,
            avatarUrl,
            address,
            bio
        }
    });

    const user = await prisma.user.findUnique({
        where: {
            id: createdUser.id
        },
        omit: {
            password: true
        }
    })

    return user;
}

const getMyProfileFromDB = async (userId : string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where : {id : userId},
        omit : {
            password : true
        }
    });

    return user;
}

const updateMyProfileInDB = async (userId : string, payload : any) => {
    const {name, email, bio, phone, avatarUrl, address} = payload;

    const updatedUser = await prisma.user.update({
        where : { id : userId},

        data : {
            name,
            email,
            phone,
            avatarUrl,
            address,
            bio
        },

        omit : {
            password : true
        }
    })

    return updatedUser;
}

export const userService = {
    registerUserIntoDB,
    getMyProfileFromDB,
    updateMyProfileInDB
}