const getUsersCollection = (db) => db.collection('users');


export const createUser = async (db, username, salt, hashedPassword, avatar) => {
    const user = {
        salt,
        hashedPassword,
        _id: username,
        avatar,
        lastPosition: [0, 0],
        lastRoom: 0
    }

    const collection = getUsersCollection(db);
    const { insertedId } = await collection.insertOne(user);

    return insertedId;
}

export const getUser = async (db, username) => {
    const collection = getUsersCollection(db);
    return await collection.findOne({
        _id: username
    });
}

export const updateLastPositionUser = async (db, username, lastPosition, roomId) => {
    const collection = getUsersCollection(db);

    const result = await collection.updateOne({ _id: username }, { $set: { lastPosition: lastPosition, lastRoom: roomId } });

    console.log(`${result.modifiedCount} one user updated in db`);

}