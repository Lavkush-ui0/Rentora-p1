import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Listing } from '../models/listing.model';
import logger from '../utils/logger';

const run = async () => {
  await connectDB();
  const allListings = await Listing.find({});
  console.log(`Total listings in DB: ${allListings.length}`);
  allListings.forEach(l => {
    console.log(`- Title: "${l.title}" | Status: ${l.status} | Approval: ${l.approvalStatus} | Availability: ${l.availability} | Location: "${l.location}"`);
  });
  process.exit(0);
};

run();
