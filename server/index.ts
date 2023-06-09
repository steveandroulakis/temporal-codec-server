import { config } from 'dotenv';
import { resolve } from 'path';
import express, { Request, Response } from 'express';
import bodyParser from "body-parser";
// TEMPORARY: Allow CORS for all origins
// import cors from 'cors';

const path = process.env.NODE_ENV === 'production'
  ? resolve(__dirname, './.env.production')
  : resolve(__dirname, './.env.development');

config({ path });

console.log(process.env.NODE_ENV);

// express handler for GET /
const app = express();

app.use(bodyParser.json());

// TEMPORARY: Allow CORS for all origins
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`Hello World!`);
});

app.listen(port, () => {
    console.log(`Codec Server listening at http://localhost:${port}`);
});