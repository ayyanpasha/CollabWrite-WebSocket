const axios = require('axios');
const Document = require('./Document');
require('dotenv').config();

const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3001;

const io = require('socket.io')(WEBSOCKET_PORT, {
    cors: {
        origin: '*',
        method: ['GET', 'POST']
    }
});

io.on("connection", (socket) => {

    socket.on("get-document", async ({ userId, documentId }) => {
        try {
            // Perform authorization check here
            const headers = {
                "Content-Type": "application/json",
                "auth-token": userId,
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
                        "auth-token": userId,
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

async function checkUserPermission(userId, documentId) {
    // Implement your permission checking logic here
    // This function should return true if the user has permission to edit the document, false otherwise
    // You may need to query your database or use other methods to check permissions
}
