import axios from 'axios';
import { Server } from 'socket.io';
import Document from './Document';
import dotenv from 'dotenv';

dotenv.config();

const WEBSOCKET_PORT: number = parseInt(process.env.WEBSOCKET_PORT || '3001', 10);

const io = new Server(WEBSOCKET_PORT, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on("connection", (socket) => {
    socket.on("get-document", async ({ userId, documentId }) => {
        try {
            // Perform authorization check here
            const headers = {
                "Content-Type": "application/json",
                "Authorization": userId,
            };
            const response = await axios.get(
                `${process.env.API_URL}/api/document/id/${documentId}`,
                { headers }
            );
            const data = await response.data
            const hasPermission = (data[0].userId !== undefined && (data[0].isAdmin === true || data[0].write === true));
            if ((!hasPermission && data[0].documentId.private) || data.errors) {
                throw new Error('Unauthenticated');
            }

            socket.join(documentId);
            const document = await data[0].documentId.document;

            socket.emit("load-document", document);

            socket.on("send-changes", delta => {
                if (hasPermission) {
                    socket.broadcast.to(documentId).emit("receive-changes", delta);
                }
            });

            socket.on("save-document", async (data) => {
                console.log(data);
                if (hasPermission) {
                    const headers = {
                        "Content-Type": "application/json",
                        "Authorization": userId,
                    };

                    try {
                        const response = await axios.put(
                            `${process.env.API_URL}/api/document/id/${documentId}`,
                            { document: data }, // Place the request body object directly as the second argument
                            { headers } // Pass the headers object as the third argument
                        );
                        // Handle response
                    } catch (error) {
                        // Handle error
                    }
                }
            });
        } catch (error) {
            console.error("Error:");
        }
    });
});
