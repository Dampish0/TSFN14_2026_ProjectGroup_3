import { Club } from "../models/club.js";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function replaceLogoAndGetUrlCloudflare(url, rawImage) {

}

async function uploadLogoAndGetUrlCloudflare(rawImage) {

}


async function saveLogoAndGetUrl(base64) {
  if (!base64) return null;
  const logosDir = path.join(process.cwd(), "public", "logos");
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }
  const logoBuffer = Buffer.from(base64, "base64");
  const logoFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
  const logoPath = path.join(logosDir, logoFileName);
  await sharp(logoBuffer)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .toFile(logoPath);
  return `/logos/${logoFileName}`;
}

export async function createClub(req, res) {
  try {
    const { name, trainers, location, established, logo, phoneNumber, email, adress } = req.body;
    if (!name || !trainers || !email) {
      return res.status(400).json({ message: "All Fields are required." });
    }
    const logoUrl = logo ? await saveLogoAndGetUrl(logo) : null;
    const club = new Club({ name, trainers, location, established, logoUrl, phoneNumber, email, adress });
    await club.save();
    res.status(201).json(club);
  } catch (error) {
    console.error("Error creating club:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getClubs(req, res) {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const allowedTextFilters = ["name", "location", "email"];
    const query = {};

    for (const key of allowedTextFilters) {
      const val = req.query[key];
      if (typeof val === "string" && val.trim() !== "") {
        query[key] = { $regex: val.trim(), $options: "i" };
      }
    }

    if (req.query.established && String(req.query.established).trim() !== "") {
      query.established = String(req.query.established).trim();
    }

    const clubs = await Club.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("trainers", "name email"); 

    res.status(200).json(clubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getClubById(req, res) {
  try {
    const { id } = req.params;
    const club = await Club.findById(id)
      .populate("trainers", "-password -resetToken -resetTokenExpiry")
      .populate("teams")
      .populate("players");
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.status(200).json(club);
  } catch (error) {
    console.error("Error fetching club:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateClub(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const role = req.user?.role || req.reqUser?.role;

    if ((role !== "superadmin" && role !== "dev" && role !== "admin") && "trainers" in updates) {
      delete updates.trainers;
    }

    if (updates.logo) {
      const logoUrl = await saveLogoAndGetUrl(updates.logo);
      updates.logoUrl = logoUrl;
      delete updates.logo;
    }

    const club = await Club.findByIdAndUpdate(id, updates, { new: true });
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.status(200).json(club);
  } catch (error) {
    console.error("Error updating club:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteClub(req, res) {
  try {
    const { id } = req.params;
    const club = await Club.findByIdAndDelete(id);
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting club:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
