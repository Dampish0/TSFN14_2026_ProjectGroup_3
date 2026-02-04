import express from "express";

//routes
import authRoutes from "./routes/authRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import refereeRoutes from "./routes/refereeRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import arenaRoutes from "./routes/arenaRoutes.js";
import seriesRoutes from "./routes/seriesRoutes.js";
import adminCaseRoutes from "./routes/adminCaseRoutes.js";

import {connectDB} from "./config/db.js";
import dotenv from "dotenv";
import ratelimiter from "./middleware/ratelimiter.js";
import cookieparser from "cookie-parser";
import cors from "cors";
import Agenda from "./config/agendaConfig.js";
import path from "path";

dotenv.config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json()); // <-- This parses JSON bodies
// app.use(ratelimiter);
app.use(cookieparser());

Agenda.start();
app.use("/logos", express.static(path.join(process.cwd(), "public", "logos")));

// we already have logging...
app.use((req, res, next) => {
    console.log(`req method is ${req.method}, Req url is ${req.url}`);
    next();
})

//app.use("/api/notes", notesRoutes)
app.use("/api/match", matchRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/referee", refereeRoutes)
app.use("/api/clubs", clubRoutes)
app.use("/api/team", teamRoutes)
app.use("/api/players", playerRoutes)
app.use("/api/arena", arenaRoutes)
app.use("/api/series", seriesRoutes)
app.use("/api/admincase", adminCaseRoutes)


const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
    });
}


//connect to db and start server
connectDB().then(() =>
{
    app.listen(port, () => {
    console.log("Server at port: " + port);
    });
});


