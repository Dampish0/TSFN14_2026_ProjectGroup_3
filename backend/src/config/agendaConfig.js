import Agenda from "agenda";
import dotenv from "dotenv";

dotenv.config();

const agenda = new Agenda({ db: { address: process.env.MONGO_URI } });

export default agenda;