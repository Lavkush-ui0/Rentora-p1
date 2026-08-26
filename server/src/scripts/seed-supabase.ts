import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

const seedSupabase = async () => {
  try {
    console.log('[Seed Supabase] Cleaning existing data...');
    // Delete in correct order (dependency order)
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rental_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('[Seed Supabase] Hashing passwords...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedStudentPassword = await bcrypt.hash('student123', 10);

    console.log('[Seed Supabase] Seeding users...');
    
    // Insert Admin
    const { data: admin, error: adminErr } = await supabase
      .from('users')
      .insert([{
        full_name: 'Rentora Admin',
        email: 'admin@niet.co.in',
        password_hash: hashedAdminPassword,
        role: 'ADMIN',
        course: 'B.Tech',
        branch: 'CSE',
        year: 4,
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        bio: 'Rentora System Administrator',
        is_verified: true,
        college_name: 'NIET Plot 19'
        
      }])
      .select()
      .single();

    if (adminErr || !admin) throw new Error(`Admin insert error: ${JSON.stringify(adminErr)}`);

    // Insert Student A
    const { data: studentA, error: saErr } = await supabase
      .from('users')
      .insert([{
        full_name: 'Rahul Sharma',
        email: 'studenta@niet.co.in',
        password_hash: hashedStudentPassword,
        role: 'STUDENT',
        course: 'B.Tech',
        branch: 'CSE',
        year: 3,
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul',
        bio: 'Coding enthusiast | Looking to rent study materials and gadgets.',
        rating_average: 4.8,
        rating_count: 2,
        completed_rentals: 2,
        is_verified: true,
        college_name: 'NIET Plot 19',
      }])
      .select()
      .single();

    if (saErr || !studentA) throw new Error(`Student A insert error: ${JSON.stringify(saErr)}`);

    // Insert Student B
    const { data: studentB, error: sbErr } = await supabase
      .from('users')
      .insert([{
        full_name: 'Priya Patel',
        email: 'studentb@niet.co.in',
        password_hash: hashedStudentPassword,
        role: 'STUDENT',
        course: 'B.Tech',
        branch: 'ECE',
        year: 2,
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
        bio: 'Robotics club member | Happy to share my tech components.',
        rating_average: 4.5,
        rating_count: 1,
        completed_rentals: 1,
        is_verified: true,
        college_name: 'NIET Plot 15',
      }])
      .select()
      .single();

    if (sbErr || !studentB) throw new Error(`Student B insert error: ${JSON.stringify(sbErr)}`);

    // Insert Student C
    const { data: studentC, error: scErr } = await supabase
      .from('users')
      .insert([{
        full_name: 'Aman Verma',
        email: 'studentc@niet.co.in',
        password_hash: hashedStudentPassword,
        role: 'STUDENT',
        course: 'B.Tech',
        branch: 'ME',
        year: 2,
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aman',
        bio: 'Automobile lover. Let me know if you need mechanical tools.',
        rating_average: 5.0,
        rating_count: 1,
        completed_rentals: 2,
        is_verified: true,
        college_name: 'NIET Plot 14',
      }])
      .select()
      .single();

    if (scErr || !studentC) throw new Error(`Student C insert error: ${JSON.stringify(scErr)}`);

    console.log('[Seed Supabase] Fetching categories...');
    const { data: categories } = await supabase.from('categories').select('*');
    if (!categories || categories.length === 0) {
      throw new Error('No categories found. Run database setup first!');
    }

    const catBooks = categories.find(c => c.slug === 'books-study-material')?.id;
    const catElectronics = categories.find(c => c.slug === 'electronics-technical')?.id;
    const catClothing = categories.find(c => c.slug === 'clothing-accessories')?.id;
    const catSports = categories.find(c => c.slug === 'sports-equipment')?.id;
    const catGaming = categories.find(c => c.slug === 'gaming')?.id;

    console.log('[Seed Supabase] Seeding listings...');

    // Student A Listings
    await supabase.from('listings').insert([
      {
        owner_id: studentA.id,
        title: 'DSA by Cormen (Introduction to Algorithms)',
        slug: 'dsa-by-cormen-intro-algorithms-1234',
        description: 'Standard textbook for Data Structures and Algorithms. The book is in good condition, no pages are missing. Perfect for CSE students prepping for exams or interviews.',
        category_id: catBooks,
        images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop'],
        condition: 'GOOD',
        rental_price: 10,
        price_unit: 'DAY',
        security_deposit: 200,
        availability: true,
        status: 'ACTIVE',
        approval_status: 'APPROVED',
        view_count: 45,
        request_count: 3,
        location: 'NIET Plot 19',
        latitude: 28.4628,
        longitude: 77.4912,
      },
      {
        owner_id: studentA.id,
        title: 'Scientific Calculator Casio fx-991EX',
        slug: 'scientific-calculator-casio-fx991ex-5678',
        description: 'Advanced scientific calculator, fully functional. Needed for engineering drawing and mathematics exams. Battery is fresh.',
        category_id: catElectronics,
        images: ['https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=600&auto=format&fit=crop'],
        condition: 'LIKE_NEW',
        rental_price: 20,
        price_unit: 'WEEK',
        security_deposit: 500,
        availability: true,
        status: 'ACTIVE',
        approval_status: 'APPROVED',
        view_count: 32,
        request_count: 1,
        location: 'NIET Plot 19',
        latitude: 28.4628,
        longitude: 77.4912,
      }
    ]);

    // Student B Listings
    await supabase.from('listings').insert([
      {
        owner_id: studentB.id,
        title: 'NIET Chemistry Lab Coat (Medium)',
        slug: 'niet-chemistry-lab-coat-medium-9012',
        description: 'Clean, ironed white lab coat. Medium size. Worn only a few times in the first year chemistry lab. Fits standard build.',
        category_id: catClothing,
        images: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=600&auto=format&fit=crop'],
        condition: 'GOOD',
        rental_price: 5,
        price_unit: 'DAY',
        security_deposit: 100,
        availability: true,
        status: 'ACTIVE',
        approval_status: 'APPROVED',
        view_count: 12,
        request_count: 2,
        location: 'NIET Plot 15',
        latitude: 28.4644,
        longitude: 77.4933,
      },
      {
        owner_id: studentB.id,
        title: 'Cricket Bat - Kashmir Willow',
        slug: 'cricket-bat-kashmir-willow-3456',
        description: 'English willow design, Kashmir willow wood cricket bat with good punch. Grip is in good shape. Comes with bat cover.',
        category_id: catSports,
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=600&auto=format&fit=crop'],
        condition: 'FAIR',
        rental_price: 150,
        price_unit: 'MONTH',
        security_deposit: 300,
        availability: true,
        status: 'ACTIVE',
        approval_status: 'APPROVED',
        view_count: 18,
        request_count: 0,
        location: 'NIET Plot 15',
        latitude: 28.4644,
        longitude: 77.4933,
      }
    ]);

    // Student C Listings
    await supabase.from('listings').insert([
      {
        owner_id: studentC.id,
        title: 'Xbox Series X/S Wireless Controller',
        slug: 'xbox-series-x-s-wireless-controller-7890',
        description: 'Carbon Black wireless controller. Connects easily with Bluetooth to laptop for FIFA/GTA gaming nights. Battery not included.',
        category_id: catGaming,
        images: ['https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=600&auto=format&fit=crop'],
        condition: 'LIKE_NEW',
        rental_price: 80,
        price_unit: 'WEEK',
        security_deposit: 1000,
        availability: true,
        status: 'ACTIVE',
        approval_status: 'APPROVED',
        view_count: 56,
        request_count: 5,
        location: 'NIET Plot 14',
        latitude: 28.4601,
        longitude: 77.4950,
      },
      {
        owner_id: studentC.id,
        title: 'Arduino Uno Starter Kit',
        slug: 'arduino-uno-starter-kit-8877',
        description: 'Arduino Uno R3 with basic breadboard, jumper wires, LEDs, resistors, and ultrasonic sensor for first-year engineering project work.',
        category_id: catElectronics,
        images: ['https://images.unsplash.com/photo-1553406830-ef2513450d76?q=80&w=600&auto=format&fit=crop'],
        condition: 'GOOD',
        rental_price: 30,
        price_unit: 'WEEK',
        security_deposit: 400,
        availability: true,
        status: 'ACTIVE',
        approval_status: 'APPROVED',
        view_count: 22,
        request_count: 1,
        location: 'NIET Plot 14',
        latitude: 28.4601,
        longitude: 77.4950,
      }
    ]);

    console.log('[Seed Supabase] Seeding users and listings completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Supabase] Error during seeding execution:', error);
    process.exit(1);
  }
};

seedSupabase();
