import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Category } from '../models/category.model';

const run = async () => {
  try {
    await connectDB();
    const categories = await Category.find({});
    console.log(`Total categories in DB: ${categories.length}`);
    categories.forEach(c => {
      console.log(`- ID: ${c._id} | Name: "${c.name}" | Slug: "${c.slug}" | isActive: ${c.isActive}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
