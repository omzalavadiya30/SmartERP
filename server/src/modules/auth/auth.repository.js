const supabase= require("../../config/supabase");
const { AppError } = require("../../utils/errors");

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

const createUser = async (userData) => {
    const { data, error } = await supabase.from("users").insert(userData).select().single();

    if (error) {
        throw new AppError(error.message, 400);
    }

    return data;
};

/*
|--------------------------------------------------------------------------
| Find User By Email
|--------------------------------------------------------------------------
*/

const findUserByEmail = async (email) => {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();

    if (error) {
        throw new AppError(error.message, 400);
    }

    return data;
};

/*
|--------------------------------------------------------------------------
| Find User By ID
|--------------------------------------------------------------------------
*/

const findUserById = async (id) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();

    if (error) {
        throw new AppError(error.message, 400);
    }

    return data;
};

/*
|--------------------------------------------------------------------------
| Find User By Reset Token
|--------------------------------------------------------------------------
*/

const findUserByResetToken = async (token) => {
    const { data, error } = await supabase.from("users").select("*").eq("password_reset_token", token).maybeSingle();

    if (error) {
        throw new AppError(error.message, 400);
    }

    return data;
};

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
*/

const updateUser = async (id, payload) => {
    const { data, error } = await supabase.from("users").update(payload).eq("id", id).select().single();

    if (error) {
        throw new AppError(error.message, 400);
    }

    return data;
};

module.exports = { createUser, findUserByEmail, findUserById, findUserByResetToken, updateUser };