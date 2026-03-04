import dotenv from "dotenv";
import Agenda from "./config/agendaConfig.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

dotenv.config();
const port = process.env.PORT || 5000;

// connect to db and start server
connectDB()
    .then(() => Agenda.start())
    .then(() => {
        app.listen(port, () => {
            console.log("Server at port: " + port);
        });
    });