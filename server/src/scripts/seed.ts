import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Category } from '../models/category.model';
import { Listing } from '../models/listing.model';
import { RentalRequest } from '../models/rentalRequest.model';
import { Conversation, Message } from '../models/chat.model';
import { Review } from '../models/review.model';
import { config } from '../config/config';

const categoriesData = [
  { name: 'Books & Study Material', slug: 'books-study-material', description: 'Academic books, notes, and preparation guides', icon: 'BookOpen' },
  { name: 'Electronics & Technical', slug: 'electronics-technical', description: 'Calculators, lab kits, components, and project gear', icon: 'Cpu' },
  { name: 'Clothing & Accessories', slug: 'clothing-accessories', description: 'Lab coats, formal wear, robes, and bags', icon: 'Shirt' },
  { name: 'Sports Equipment', slug: 'sports-equipment', description: 'Cricker bats, footballs, rackets, and athletic gear', icon: 'Trophy' },
  { name: 'Gaming', slug: 'gaming', description: 'Consoles, controllers, and game titles', icon: 'Gamepad2' },
  { name: 'Other', slug: 'other', description: 'Miscellaneous student utilities', icon: 'Layers' },
];

const seed = async () => {
  try {
    console.log('[Seed Script] Connecting to database...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('[Seed Script] Connected. Cleaning collections...');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Listing.deleteMany({});
    await RentalRequest.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Review.deleteMany({});

    console.log('[Seed Script] Seeding categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`[Seed Script] Seeding ${categories.length} categories completed.`);

    console.log('[Seed Script] Hashing passwords...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedStudentPassword = await bcrypt.hash('student123', 10);

    console.log('[Seed Script] Seeding users...');
    const admin = await User.create({
      fullName: 'Rentora Admin',
      email: 'admin@niet.co.in',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      course: 'B.Tech',
      branch: 'CSE',
      year: 4,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      bio: 'Rentora System Administrator',
      isVerified: true,
    });

    const studentA = await User.create({
      fullName: 'Rahul Sharma',
      email: 'studenta@niet.co.in',
      passwordHash: hashedStudentPassword,
      role: 'STUDENT',
      course: 'B.Tech',
      branch: 'CSE',
      year: 3,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul',
      bio: 'Coding enthusiast | Looking to rent study materials and gadgets.',
      ratingAverage: 4.8,
      ratingCount: 2,
      completedRentals: 2,
      isVerified: true,
    });

    const studentB = await User.create({
      fullName: 'Priya Patel',
      email: 'studentb@niet.co.in',
      passwordHash: hashedStudentPassword,
      role: 'STUDENT',
      course: 'B.Tech',
      branch: 'ECE',
      year: 2,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
      bio: 'Robotics club member | Happy to share my tech components.',
      ratingAverage: 4.5,
      ratingCount: 1,
      completedRentals: 1,
      isVerified: true,
    });

    const studentC = await User.create({
      fullName: 'Aman Verma',
      email: 'studentc@niet.co.in',
      passwordHash: hashedStudentPassword,
      role: 'STUDENT',
      course: 'B.Tech',
      branch: 'ME',
      year: 2,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aman',
      bio: 'Automobile lover. Let me know if you need mechanical tools.',
      ratingAverage: 5.0,
      ratingCount: 0,
      completedRentals: 0,
      isVerified: true,
    });

    console.log('[Seed Script] Seeding listings...');
    const catBooks = categories.find(c => c.slug === 'books-study-material')!._id;
    const catElectronics = categories.find(c => c.slug === 'electronics-technical')!._id;
    const catClothing = categories.find(c => c.slug === 'clothing-accessories')!._id;
    const catSports = categories.find(c => c.slug === 'sports-equipment')!._id;
    const catGaming = categories.find(c => c.slug === 'gaming')!._id;

    // Student A listings
    const listingDSA = await Listing.create({
      owner: studentA._id,
      title: 'DSA by Cormen (Introduction to Algorithms)',
      slug: 'dsa-by-cormen-intro-algorithms-1234',
      description: 'Standard textbook for Data Structures and Algorithms. The book is in good condition, no pages are missing. Perfect for CSE students prepping for exams or interviews.',
      category: catBooks,
      images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop'],
      condition: 'GOOD',
      rentalPrice: 10,
      priceUnit: 'DAY',
      securityDeposit: 200,
      availability: true,
      status: 'ACTIVE',
      viewCount: 45,
      requestCount: 3,
    });

    const listingCalc = await Listing.create({
      owner: studentA._id,
      title: 'Scientific Calculator Casio fx-991EX',
      slug: 'scientific-calculator-casio-fx991ex-5678',
      description: 'Advanced scientific calculator, fully functional. Needed for engineering drawing and mathematics exams. Battery is fresh.',
      category: catElectronics,
      images: ['https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=600&auto=format&fit=crop'],
      condition: 'LIKE_NEW',
      rentalPrice: 20,
      priceUnit: 'WEEK',
      securityDeposit: 500,
      availability: true,
      status: 'ACTIVE',
      viewCount: 32,
      requestCount: 1,
    });

    // Student B listings
    const listingCoat = await Listing.create({
      owner: studentB._id,
      title: 'NIET Chemistry Lab Coat (Medium)',
      slug: 'niet-chemistry-lab-coat-medium-9012',
      description: 'Clean, ironed white lab coat. Medium size. Worn only a few times in the first year chemistry lab. Fits standard build.',
      category: catClothing,
      images: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=600&auto=format&fit=crop'],
      condition: 'GOOD',
      rentalPrice: 5,
      priceUnit: 'DAY',
      securityDeposit: 100,
      availability: true,
      status: 'ACTIVE',
      viewCount: 12,
      requestCount: 2,
    });

    const listingBat = await Listing.create({
      owner: studentB._id,
      title: 'Cricket Bat - Kashmir Willow',
      slug: 'cricket-bat-kashmir-willow-3456',
      description: 'English willow design, Kashmir willow wood cricket bat with good punch. Grip is in good shape. Comes with bat cover.',
      category: catSports,
      images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=600&auto=format&fit=crop'],
      condition: 'FAIR',
      rentalPrice: 150,
      priceUnit: 'MONTH',
      securityDeposit: 300,
      availability: true,
      status: 'ACTIVE',
      viewCount: 18,
      requestCount: 0,
    });

    // Student C listings
    const listingController = await Listing.create({
      owner: studentC._id,
      title: 'Xbox Series X/S Wireless Controller',
      slug: 'xbox-series-x-s-wireless-controller-7890',
      description: 'Carbon Black wireless controller. Connects easily with Bluetooth to laptop for FIFA/GTA gaming nights. Battery not included.',
      category: catGaming,
      images: ['https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=600&auto=format&fit=crop'],
      condition: 'LIKE_NEW',
      rentalPrice: 80,
      priceUnit: 'WEEK',
      securityDeposit: 1000,
      availability: true,
      status: 'ACTIVE',
      viewCount: 56,
      requestCount: 5,
    });

    console.log('[Seed Script] Seeding rental requests...');
    // Request 1: Pending (Priya requests Rahul's Calculator)
    const request1 = await RentalRequest.create({
      listing: listingCalc._id,
      owner: studentA._id,
      renter: studentB._id,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // next week
      message: 'Hey Rahul, I need this calculator for my Math-III end sem exam next week. Will return it promptly.',
      status: 'PENDING',
    });

    // Request 2: Completed (Rahul rented Priya's Lab Coat)
    const request2 = await RentalRequest.create({
      listing: listingCoat._id,
      owner: studentB._id,
      renter: studentA._id,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      message: 'Need it for chemistry lab evaluation.',
      status: 'COMPLETED',
    });

    console.log('[Seed Script] Seeding conversations & messages...');
    // Conversation for pending request
    const conversation1 = await Conversation.create({
      participants: [studentA._id, studentB._id],
      listing: listingCalc._id,
      rentalRequest: request1._id,
    });

    const msg1 = await Message.create({
      conversation: conversation1._id,
      sender: studentB._id,
      text: 'Hey Rahul, I have submitted a rental request for your scientific calculator.',
    });

    const msg2 = await Message.create({
      conversation: conversation1._id,
      sender: studentA._id,
      text: 'Hey Priya, sure! I am free today. Can you meet near the block-A canteen around 1 PM?',
      readAt: new Date(),
    });

    conversation1.lastMessage = msg2._id as any;
    await conversation1.save();

    console.log('[Seed Script] Seeding reviews...');
    // Review 1: Priya reviews Rahul for the lab coat (which he rented from her)
    // Wait, Rahul was the renter, Priya was the owner
    const review1 = await Review.create({
      reviewer: studentB._id, // owner
      reviewee: studentA._id, // renter
      rentalRequest: request2._id,
      rating: 5,
      comment: 'Rahul was super nice. Kept the lab coat clean and returned it on time!',
    });

    // Review 2: Rahul reviews Priya for the lab coat
    const review2 = await Review.create({
      reviewer: studentA._id, // renter
      reviewee: studentB._id, // owner
      rentalRequest: request2._id,
      rating: 4,
      comment: 'Very helpful, easy handover near the ECE block.',
    });

    console.log('[Seed Script] Seeding completed successfully!');
    console.log(`
      SEED CREDENTIALS (DEVELOPMENT ONLY):
      ===================================
      ADMIN:   email: admin@niet.co.in    password: admin123
      STUDENT: email: studenta@niet.co.in password: student123 (Rahul Sharma)
      STUDENT: email: studentb@niet.co.in password: student123 (Priya Patel)
      STUDENT: email: studentc@niet.co.in password: student123 (Aman Verma)
    `);

    await mongoose.connection.close();
  } catch (error) {
    console.error('[Seed Script] Seeding failed:', error);
    process.exit(1);
  }
};

seed();
