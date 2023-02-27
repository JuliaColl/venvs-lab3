import express from 'express';
import http from 'http';
import * as dotenv from 'dotenv';
import initWebsocketsApi from './backend/ws/index.js';
import initRestApi from './backend/rest/index.js';
import mongo from 'mongodb';
import AuthTokenCache from './backend/services/AuthTokenCache.js';
import UserPositionCache from './backend/services/UserPositionCache.js';

// load environment variables
dotenv.config({ path: '.env.dev' })  
dotenv.config({ path: '.env' })

// http server
const app = express();
app.use(express.static('frontend'));
app.use(express.json());
const httpServer = http.createServer(app);

// in-memory stateful services
const authenticator = new AuthTokenCache();
const userPositionCache = new UserPositionCache();

// database
const db = await mongo.MongoClient.connect(process.env.DB_URL);

// APIs
initRestApi(app, db, authenticator);
initWebsocketsApi(httpServer, db, authenticator, userPositionCache);

// start server
httpServer.listen(process.env.PORT, () => 
  console.log(`Server started on port ${httpServer.address().port} | ENV=${process.env.ENV ?? 'prod'}`)
);
