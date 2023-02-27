export class Message {
    id = null;
    username = null;
    data = null;
    
    constructor(id, username, data, ownership) {
        if (ownership !== 'me' && ownership !== 'other') {
            throw new Error('ownership must be either me or other')
        }

        this.id = id;
        this.username = username;
        this.data = data;
        this.ownership = ownership;
    };
}
