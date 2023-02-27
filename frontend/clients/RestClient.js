import { STATIC_FILE_URI } from "../config.js";

const post = async (url, data) => {
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }); 
    return { status: response.status, data: await response.json()};
}

export const login = async (username, password) => {
    return await post(STATIC_FILE_URI + 'api/v1/auth/login', { username, password });
}

export const signUp = async (username, password, avatar) => {
    return await post(STATIC_FILE_URI + 'api/v1/users', { username, password, avatar });
}

export default {
    login,
    signUp
}
