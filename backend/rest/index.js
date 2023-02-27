import { createUser , getUser } from "../database/users.js";

export default (app, db, authenticator) => {
    app.post('/api/v1/users', async (req, res) => {
        const body = req.body;
        if (!body.username) return res.status(400).json({
            reason: "missing 'username' in body"
        })
        if (!body.password) return res.status(400).json({
            reason: "missing 'password' in body"
        })
        if (body.avatar === undefined || body.avatar === null) return res.status(400).json({
            reason: "missing 'avatar' in body"
        })

        const { hash, salt } = authenticator.hash(body.password)
        const username = body.username.toString().toLowerCase();

        try {
            await createUser(db, username, salt, hash, body.avatar);
        } catch {
            return res.status(400).json({
                reason: "A user with the same username already exists."
            });
        }
        
        return res.status(200).json({username: username, avatar: body.avatar});

    })

    app.post('/api/v1/auth/login', async (req, res) => {
        const body = req.body;
        if (!body.username) return res.status(400).json({
            reason: "missing 'username' in body"
        })
        if (!body.password) return res.status(400).json({
            reason: "missing 'password' in body"
        })

        const username = body.username.toString().toLowerCase();
        const dbUser = await getUser(db, username)
        if (!dbUser) return res.status(401).json({
            reason: "authentication not valid"
        })

        const { hash } = authenticator.hash(body.password, dbUser.salt)
        if (!authenticator.timeSafeEqual(hash, dbUser.hashedPassword)) return res.status(401).json({
            reason: "authentication not valid"
        })

        const token = authenticator.newSessionToken(username)
        
        return res.status(200).json({
            token,
            user: {
                username: dbUser._id,
                avatar: dbUser.avatar
            }
        });
    })
}