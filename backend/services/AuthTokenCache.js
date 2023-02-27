import { uuid } from '../../frontend/utils.js';

import crypto from 'crypto';
const md5 = (x) => crypto.createHash('md5').update(x).digest("hex");

export default class Authenticator {
    #sessions = {}
    #expirationMs = 1000 * 60 * 60 * 3;  // 3h

    constructor() {
      this.sessions = {};
    }

    hash(password, salt=null){
        if (!salt) salt = uuid();
        return {
            hash: md5(password.toString()+salt),
            salt: salt
        }
    }

    timeSafeEqual(x, y){
        return crypto.timingSafeEqual(Buffer.from(x), Buffer.from(y))
    }

    newSessionToken(username){
        const token = uuid();
        this.sessions[token] = {
            username,
            expiresAt: Date.now() + this.expirationMs
        }
        return token;
    }

    isTokenValid(token){
        const session = this.sessions[token]
        if (!session) return [false, "the token is invalid"];
        if (session.expiresAt < Date.now()) {
            delete this.sessions[token]
            return [false, "the token has expired"];
        }
        return [true, session.username];
    }

    getUsername(token){
        const [isValid, username] = this.isTokenValid(token)
        if (!isValid) return null;
        return username;
    }
}
