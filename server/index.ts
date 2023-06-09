import { config } from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import * as proto from '@temporalio/proto';
import { EncryptionCodec } from './encryption-codec';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { JwtHeader, VerifyOptions } from 'jsonwebtoken';
import jwksClient, { RsaSigningKey, SigningKey } from "jwks-rsa";

// most of this code is from the Temporal samples repo
// https://github.com/temporalio/samples-typescript/blob/main/encryption/src/codec-server.ts

type Payload = proto.temporal.api.common.v1.IPayload;

const client = jwksClient({
    jwksUri: 'https://prod-tmprl.us.auth0.com/.well-known/jwks.json',
});

// get JWT signing key
function getKey(header: JwtHeader, callback: (err: Error | null, key?: string | Buffer) => void): void {
    client.getSigningKey(header.kid as string, (err: Error | null, key?: SigningKey) => {
        callback(err, key?.getPublicKey());
    });
}

interface JSONPayload {
    metadata?: Record<string, string> | null;
    data?: string | null;
}

interface Body {
    payloads: JSONPayload[];
}

const path = process.env.NODE_ENV === 'production'
    ? resolve(__dirname, './.env.production')
    : resolve(__dirname, './.env.development');

config({ path });

console.log(process.env.NODE_ENV);

const port = process.env.PORT || 3000;

/**
 * Helper function to convert a valid proto JSON to a payload object.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
function fromJSON({ metadata, data }: JSONPayload): Payload {
    return {
        metadata:
            metadata &&
            Object.fromEntries(Object.entries(metadata).map(([k, v]): [string, Uint8Array] => [k, Buffer.from(v, 'base64')])),
        data: data ? Buffer.from(data, 'base64') : undefined,
    };
}

/**
 * Helper function to convert a payload object to a valid proto JSON.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
function toJSON({ metadata, data }: proto.temporal.api.common.v1.IPayload): JSONPayload {
    return {
        metadata:
            metadata &&
            Object.fromEntries(
                Object.entries(metadata).map(([k, v]): [string, string] => [k, Buffer.from(v).toString('base64')])
            ),
        data: data ? Buffer.from(data).toString('base64') : undefined,
    };
}

async function main() {

    const codec = await EncryptionCodec.create('c2EtZGVtby1rZXk=');

    const app = express();
    app.use(cors({
        origin: 'https://cloud.temporal.io',  // Or true to allow any origin
        allowedHeaders: ['x-namespace', 'content-type', 'authorization'], // Added 'authorization'
        credentials: true  // This is the important line
    }));
    app.use(express.json());

    app.post('/decode', async (req, res) => {
        //console.log(`Received request to /decode`);
        //console.log('Request headers:', req.headers);
        //console.log('Request body:', req.body);
        
        const authHeader = req.headers.authorization;
        //console.log(`Auth header: ${authHeader}`);

        const printToken = authHeader ? authHeader.split(' ')[1] : undefined;
        //console.log(`Authorization token: ${printToken}`);

        // if auth header doesn't exist or doesn't start with 'Bearer ' then reject
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).end('Unauthorized');
        }

        // getKey from Temporal's jwks.json and verify token against it
        const token = authHeader.split(' ')[1];
        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
            if (err) {
                console.error('Failed to verify token:', err);
                return res.status(403).end('Invalid token');
            }

            console.log('Decoded JWT:', decoded);  // This will print the payload of the JWT

            // Here you can use the claims in `decoded` to identify the user and authorize their request.
        });

        try {
            const { payloads: raw } = req.body as Body;
            const encoded = raw.map(fromJSON);
            const decoded = await codec.decode(encoded);
            const payloads = decoded.map(toJSON);
            res.json({ payloads }).end();
        } catch (err) {
            console.error('Error in /decode', err);
            res.status(500).end('Internal server error');
        }
    });

    app.post('/encode', async (req, res) => {
        try {
            const { payloads: raw } = req.body as Body;
            const decoded = raw.map(fromJSON);
            const encoded = await codec.encode(decoded);
            const payloads = encoded.map(toJSON);
            res.json({ payloads }).end();
        } catch (err) {
            console.error('Error in /encode', err);
            res.status(500).end('Internal server error');
        }
    });

    app.get('/', (req, res) => {
        res.send(`Hi from the Temporal Codec Server`);
    });

    await new Promise<void>((resolve, reject) => {
        app.listen(port, () => {
            console.log(`Codec Server listening at http://localhost:${port}`);
        });
        app.on('error', reject);
    });

}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});