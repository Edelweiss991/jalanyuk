import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script for JalanYuk platform (Development Mode)
 * 
 * WARNING: This seed script deletes existing schedules and seats to ensure
 * fresh, relative-dated schedules for development. Do not run in production.
 * 
 * Approach:
 * - SystemSettings, Coupons, Users, Operators, Terminals/Stations, Routes: upserted by unique keys
 * - Schedules & Seats: deleted at start, then recreated with dates relative to seed time
 * - Deterministic booking pattern: some seats marked as booked using modulo pattern
 */

// Helper: Generate deterministic price based on route distance/duration
function priceFor(type: 'BUS' | 'TRAIN', durationMinutes: number): number {
  const base = type === 'BUS' ? 100000 : 150000;
  const perHour = type === 'BUS' ? 30000 : 70000;
  const hours = durationMinutes / 60;
  return Math.floor(base + perHour * hours);
}

// Helper: Generate seat numbers for bus (10 rows × 4 cols: A,B,C,D with aisle after B)
function generateBusSeats(): string[] {
  const seats: string[] = [];
  for (let row = 1; row <= 10; row++) {
    for (const col of ['A', 'B', 'C', 'D']) {
      seats.push(`${row}${col}`);
    }
  }
  return seats;
}

// Helper: Generate seat numbers for train (16 rows × 4 cols, capacity 64)
function generateTrainSeats(): string[] {
  const seats: string[] = [];
  for (let row = 1; row <= 16; row++) {
    for (const col of ['A', 'B', 'C', 'D']) {
      seats.push(`${row}${col}`);
    }
  }
  return seats;
}

// Helper: Deterministic booking pattern (~10% booked seats)
function isDeterministicBooked(seatIndex: number, scheduleIndex: number): boolean {
  // Use modulo pattern to mark ~10% as booked consistently
  return (seatIndex + scheduleIndex) % 11 === 0;
}

async function main() {
  console.log('🌱 Starting JalanYuk seed (Development)...');
  
  // STEP 0: Clean up schedules and seats from previous seed
  console.log('🧹 Cleaning previous schedules and seats...');
  await prisma.trainSeat.deleteMany({});
  await prisma.busSeat.deleteMany({});
  await prisma.trainSchedule.deleteMany({});
  await prisma.busSchedule.deleteMany({});
  console.log('✅ Previous schedules and seats cleared');

  // STEP 1: System Settings
  console.log('⚙️  Creating system settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'platform_name' },
    update: {},
    create: { key: 'platform_name', value: 'JalanYuk', description: 'Nama platform' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'copyright' },
    update: {},
    create: { key: 'copyright', value: '© 2026 JalanYuk. All rights reserved.', description: 'Footer copyright' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'service_fee_per_passenger' },
    update: {},
    create: { key: 'service_fee_per_passenger', value: '5000', description: 'Biaya layanan per penumpang (IDR)' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'default_theme' },
    update: {},
    create: { key: 'default_theme', value: 'system', description: 'Tema default (light/dark/system)' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'support_email' },
    update: {},
    create: { key: 'support_email', value: 'support@jalanyuk.id', description: 'Email dukungan pelanggan' }
  });

  // STEP 2: Coupons
  console.log('🎟️  Creating coupons...');
  await prisma.coupon.upsert({
    where: { code: 'JALANYUK10' },
    update: {},
    create: {
      code: 'JALANYUK10',
      description: 'Diskon 10% untuk transaksi minimal 100rb (maks diskon 50rb)',
      discountType: 'PERCENT',
      discountValue: 10,
      minTransaction: 100000,
      maxDiscount: 50000,
      isActive: true
    }
  });
  await prisma.coupon.upsert({
    where: { code: 'HEMAT20' },
    update: {},
    create: {
      code: 'HEMAT20',
      description: 'Diskon 20% untuk transaksi minimal 300rb (maks diskon 100rb)',
      discountType: 'PERCENT',
      discountValue: 20,
      minTransaction: 300000,
      maxDiscount: 100000,
      isActive: true
    }
  });
  await prisma.coupon.upsert({
    where: { code: 'NEWUSER' },
    update: {},
    create: {
      code: 'NEWUSER',
      description: 'Potongan 25rb untuk transaksi minimal 75rb (pengguna baru)',
      discountType: 'FIXED',
      discountValue: 25000,
      minTransaction: 75000,
      isActive: true
    }
  });

  // STEP 3: Users (Admin & Customer Demo)
  console.log('👤 Creating demo users...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@jalanyuk.id';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const customerEmail = process.env.CUSTOMER_EMAIL || 'demo@jalanyuk.id';
  const customerPassword = process.env.CUSTOMER_PASSWORD || 'demo123';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const customerPasswordHash = await bcrypt.hash(customerPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true
    }
  });

  await prisma.userProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      fullName: 'Administrator JalanYuk',
      phone: '081234567890'
    }
  });

  const customerUser = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      isActive: true
    }
  });

  await prisma.userProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      fullName: 'Demo Customer',
      phone: '081298765432',
      address: 'Jakarta, Indonesia'
    }
  });

  console.log(`✅ Admin: ${adminEmail} / ${adminPassword} (DEMO)`);
  console.log(`✅ Customer: ${customerEmail} / ${customerPassword} (DEMO)`);

  // STEP 4: Bus Operators & Buses
  console.log('🚌 Creating bus operators and buses...');
  
  const rosaliaIndah = await prisma.busOperator.upsert({
    where: { code: 'RI' },
    update: {},
    create: {
      name: 'Rosalia Indah',
      code: 'RI',
      description: 'PO Bus terpercaya sejak 1980 (Data Simulasi)',
      isActive: true
    }
  });

  const sinarJaya = await prisma.busOperator.upsert({
    where: { code: 'SJ' },
    update: {},
    create: {
      name: 'Sinar Jaya',
      code: 'SJ',
      description: 'Bus premium untuk perjalanan nyaman (Data Simulasi)',
      isActive: true
    }
  });

  const gunungHarta = await prisma.busOperator.upsert({
    where: { code: 'GH' },
    update: {},
    create: {
      name: 'Gunung Harta',
      code: 'GH',
      description: 'Melayani rute antarkota dengan armada modern (Data Simulasi)',
      isActive: true
    }
  });

  const seatLayout = { rows: 10, cols: 4, aisleAfter: 2 };
  const facilities = ['AC', 'Toilet', 'Reclining Seat', 'Snack'];

  await prisma.bus.upsert({
    where: { id: 'bus-ri-1' },
    update: {},
    create: {
      id: 'bus-ri-1',
      operatorId: rosaliaIndah.id,
      name: 'Rosalia Indah Eksekutif 001',
      plateNumber: 'B 1234 RI',
      capacity: 40,
      seatLayout,
      facilities,
      className: 'Eksekutif',
      isActive: true
    }
  });

  await prisma.bus.upsert({
    where: { id: 'bus-sj-1' },
    update: {},
    create: {
      id: 'bus-sj-1',
      operatorId: sinarJaya.id,
      name: 'Sinar Jaya Super Eksekutif 001',
      plateNumber: 'B 5678 SJ',
      capacity: 40,
      seatLayout,
      facilities: [...facilities, 'WiFi', 'Charging Port'],
      className: 'Super Eksekutif',
      isActive: true
    }
  });

  await prisma.bus.upsert({
    where: { id: 'bus-gh-1' },
    update: {},
    create: {
      id: 'bus-gh-1',
      operatorId: gunungHarta.id,
      name: 'Gunung Harta Eksekutif 001',
      plateNumber: 'D 9999 GH',
      capacity: 40,
      seatLayout,
      facilities,
      className: 'Eksekutif',
      isActive: true
    }
  });

  // STEP 5: Bus Terminals
  console.log('🚏 Creating bus terminals...');
  
  const kampungRambutan = await prisma.busTerminal.upsert({
    where: { id: 'terminal-kr' },
    update: {},
    create: {
      id: 'terminal-kr',
      name: 'Terminal Kampung Rambutan',
      city: 'Jakarta',
      address: 'Jl. Raya Bogor KM 23, Jakarta Timur',
      isActive: true
    }
  });

  const pulogebang = await prisma.busTerminal.upsert({
    where: { id: 'terminal-pg' },
    update: {},
    create: {
      id: 'terminal-pg',
      name: 'Terminal Pulogebang',
      city: 'Jakarta',
      address: 'Jl. Bekasi Timur Raya, Jakarta Timur',
      isActive: true
    }
  });

  const bekasi = await prisma.busTerminal.upsert({
    where: { id: 'terminal-bks' },
    update: {},
    create: {
      id: 'terminal-bks',
      name: 'Terminal Bekasi',
      city: 'Bekasi',
      address: 'Jl. Ahmad Yani, Bekasi',
      isActive: true
    }
  });

  const leuwiPanjang = await prisma.busTerminal.upsert({
    where: { id: 'terminal-lp' },
    update: {},
    create: {
      id: 'terminal-lp',
      name: 'Terminal Leuwi Panjang',
      city: 'Bandung',
      address: 'Jl. Soekarno-Hatta, Bandung',
      isActive: true
    }
  });

  const bungurasih = await prisma.busTerminal.upsert({
    where: { id: 'terminal-br' },
    update: {},
    create: {
      id: 'terminal-br',
      name: 'Terminal Bungurasih',
      city: 'Surabaya',
      address: 'Jl. Ir. H. Juanda, Surabaya',
      isActive: true
    }
  });

  const tirtonadi = await prisma.busTerminal.upsert({
    where: { id: 'terminal-tn' },
    update: {},
    create: {
      id: 'terminal-tn',
      name: 'Terminal Tirtonadi',
      city: 'Solo',
      address: 'Jl. Ahmad Yani, Solo',
      isActive: true
    }
  });

  // STEP 6: Bus Routes
  console.log('🛣️  Creating bus routes...');
  
  const busRoutes = [
    {
      id: 'route-bus-jkt-bdg',
      originTerminalId: kampungRambutan.id,
      destinationTerminalId: leuwiPanjang.id,
      distanceKm: 150,
      durationMinutes: 180
    },
    {
      id: 'route-bus-jkt-sby',
      originTerminalId: pulogebang.id,
      destinationTerminalId: bungurasih.id,
      distanceKm: 700,
      durationMinutes: 660
    },
    {
      id: 'route-bus-bks-solo',
      originTerminalId: bekasi.id,
      destinationTerminalId: tirtonadi.id,
      distanceKm: 550,
      durationMinutes: 540
    },
    {
      id: 'route-bus-bdg-jkt',
      originTerminalId: leuwiPanjang.id,
      destinationTerminalId: kampungRambutan.id,
      distanceKm: 150,
      durationMinutes: 180
    },
    {
      id: 'route-bus-sby-jkt',
      originTerminalId: bungurasih.id,
      destinationTerminalId: pulogebang.id,
      distanceKm: 700,
      durationMinutes: 660
    }
  ];

  for (const routeData of busRoutes) {
    await prisma.busRoute.upsert({
      where: { id: routeData.id },
      update: {},
      create: routeData
    });
  }

  // STEP 7: Train Operators, Stations, Trains, Routes
  console.log('🚆 Creating train operators, stations, and trains...');
  
  const ptKai = await prisma.trainOperator.upsert({
    where: { code: 'KAI' },
    update: {},
    create: {
      name: 'PT KAI (Data Simulasi)',
      code: 'KAI',
      isActive: true
    }
  });

  const gambir = await prisma.trainStation.upsert({
    where: { code: 'GMR' },
    update: {},
    create: {
      name: 'Gambir',
      code: 'GMR',
      city: 'Jakarta',
      address: 'Jl. Medan Merdeka Timur, Jakarta Pusat',
      isActive: true
    }
  });

  const pasarSenen = await prisma.trainStation.upsert({
    where: { code: 'PSE' },
    update: {},
    create: {
      name: 'Pasar Senen',
      code: 'PSE',
      city: 'Jakarta',
      address: 'Jl. Pasar Senen, Jakarta Pusat',
      isActive: true
    }
  });

  const bandungStation = await prisma.trainStation.upsert({
    where: { code: 'BD' },
    update: {},
    create: {
      name: 'Bandung',
      code: 'BD',
      city: 'Bandung',
      address: 'Jl. Kebon Kawung, Bandung',
      isActive: true
    }
  });

  const yogyakarta = await prisma.trainStation.upsert({
    where: { code: 'YK' },
    update: {},
    create: {
      name: 'Yogyakarta',
      code: 'YK',
      city: 'Yogyakarta',
      address: 'Jl. Pasar Kembang, Yogyakarta',
      isActive: true
    }
  });

  const surabayaGubeng = await prisma.trainStation.upsert({
    where: { code: 'SGU' },
    update: {},
    create: {
      name: 'Surabaya Gubeng',
      code: 'SGU',
      city: 'Surabaya',
      address: 'Jl. Gubernur Suryo, Surabaya',
      isActive: true
    }
  });

  await prisma.train.upsert({
    where: { id: 'train-argo-1' },
    update: {},
    create: {
      id: 'train-argo-1',
      operatorId: ptKai.id,
      name: 'Argo Parahyangan (Simulasi)',
      trainNumber: 'KA 36',
      className: 'Eksekutif',
      capacity: 64,
      facilities: ['AC', 'Reclining Seat', 'Meal', 'Power Outlet'],
      isActive: true
    }
  });

  await prisma.train.upsert({
    where: { id: 'train-taksaka-1' },
    update: {},
    create: {
      id: 'train-taksaka-1',
      operatorId: ptKai.id,
      name: 'Taksaka (Simulasi)',
      trainNumber: 'KA 68',
      className: 'Eksekutif',
      capacity: 64,
      facilities: ['AC', 'Reclining Seat', 'Meal', 'WiFi'],
      isActive: true
    }
  });

  await prisma.train.upsert({
    where: { id: 'train-lodaya-1' },
    update: {},
    create: {
      id: 'train-lodaya-1',
      operatorId: ptKai.id,
      name: 'Lodaya (Simulasi)',
      trainNumber: 'KA 92',
      className: 'Ekonomi Premium',
      capacity: 64,
      facilities: ['AC', 'Standard Seat'],
      isActive: true
    }
  });

  const trainRoutes = [
    {
      id: 'route-train-gmr-bd',
      originStationId: gambir.id,
      destinationStationId: bandungStation.id,
      distanceKm: 150,
      durationMinutes: 180
    },
    {
      id: 'route-train-pse-yk',
      originStationId: pasarSenen.id,
      destinationStationId: yogyakarta.id,
      distanceKm: 500,
      durationMinutes: 480
    },
    {
      id: 'route-train-gmr-sgu',
      originStationId: gambir.id,
      destinationStationId: surabayaGubeng.id,
      distanceKm: 700,
      durationMinutes: 540
    },
    {
      id: 'route-train-bd-gmr',
      originStationId: bandungStation.id,
      destinationStationId: gambir.id,
      distanceKm: 150,
      durationMinutes: 180
    }
  ];

  for (const routeData of trainRoutes) {
    await prisma.trainRoute.upsert({
      where: { id: routeData.id },
      update: {},
      create: routeData
    });
  }

  // STEP 8: Generate schedules with relative dates (tomorrow to +7 days)
  console.log('📅 Generating schedules with relative dates...');
  
  const seedDate = new Date();
  const scheduleDays = [1, 2, 3, 5, 7]; // Days offset from seed date
  const scheduleTimes = ['06:00', '09:30', '13:00', '19:00'];
  
  let busScheduleCount = 0;
  let trainScheduleCount = 0;
  let scheduleIndex = 0;

  // Bus Schedules
  const busScheduleConfigs = [
    { routeId: 'route-bus-jkt-bdg', busId: 'bus-ri-1', operatorId: rosaliaIndah.id },
    { routeId: 'route-bus-jkt-sby', busId: 'bus-sj-1', operatorId: sinarJaya.id },
    { routeId: 'route-bus-bks-solo', busId: 'bus-gh-1', operatorId: gunungHarta.id },
    { routeId: 'route-bus-bdg-jkt', busId: 'bus-ri-1', operatorId: rosaliaIndah.id },
    { routeId: 'route-bus-sby-jkt', busId: 'bus-sj-1', operatorId: sinarJaya.id }
  ];

  for (const config of busScheduleConfigs) {
    const route = await prisma.busRoute.findUnique({ where: { id: config.routeId } });
    if (!route) continue;

    for (const dayOffset of scheduleDays) {
      for (const time of scheduleTimes.slice(0, 2)) { // 2 times per day per route
        const [hours, minutes] = time.split(':').map(Number);
        const departureDate = new Date(seedDate);
        departureDate.setDate(departureDate.getDate() + dayOffset);
        departureDate.setHours(hours, minutes, 0, 0);

        const arrivalDate = new Date(departureDate);
        arrivalDate.setMinutes(arrivalDate.getMinutes() + route.durationMinutes);

        const price = priceFor('BUS', route.durationMinutes);

        const schedule = await prisma.busSchedule.create({
          data: {
            operatorId: config.operatorId,
            busId: config.busId,
            routeId: config.routeId,
            departureTerminalId: route.originTerminalId,
            arrivalTerminalId: route.destinationTerminalId,
            departureTime: departureDate,
            arrivalTime: arrivalDate,
            price,
            status: 'ACTIVE'
          }
        });

        // Create seats
        const busSeats = generateBusSeats();
        for (let i = 0; i < busSeats.length; i++) {
          await prisma.busSeat.create({
            data: {
              scheduleId: schedule.id,
              seatNumber: busSeats[i],
              isBooked: isDeterministicBooked(i, scheduleIndex)
            }
          });
        }

        busScheduleCount++;
        scheduleIndex++;
      }
    }
  }

  // Train Schedules
  const trainScheduleConfigs = [
    { routeId: 'route-train-gmr-bd', trainId: 'train-argo-1', operatorId: ptKai.id },
    { routeId: 'route-train-pse-yk', trainId: 'train-taksaka-1', operatorId: ptKai.id },
    { routeId: 'route-train-gmr-sgu', trainId: 'train-taksaka-1', operatorId: ptKai.id },
    { routeId: 'route-train-bd-gmr', trainId: 'train-lodaya-1', operatorId: ptKai.id }
  ];

  for (const config of trainScheduleConfigs) {
    const route = await prisma.trainRoute.findUnique({ where: { id: config.routeId } });
    if (!route) continue;

    for (const dayOffset of scheduleDays) {
      for (const time of scheduleTimes.slice(0, 2)) { // 2 times per day per route
        const [hours, minutes] = time.split(':').map(Number);
        const departureDate = new Date(seedDate);
        departureDate.setDate(departureDate.getDate() + dayOffset);
        departureDate.setHours(hours, minutes, 0, 0);

        const arrivalDate = new Date(departureDate);
        arrivalDate.setMinutes(arrivalDate.getMinutes() + route.durationMinutes);

        const price = priceFor('TRAIN', route.durationMinutes);

        const schedule = await prisma.trainSchedule.create({
          data: {
            operatorId: config.operatorId,
            trainId: config.trainId,
            routeId: config.routeId,
            departureStationId: route.originStationId,
            arrivalStationId: route.destinationStationId,
            departureTime: departureDate,
            arrivalTime: arrivalDate,
            price,
            status: 'ACTIVE'
          }
        });

        // Create seats
        const trainSeats = generateTrainSeats();
        for (let i = 0; i < trainSeats.length; i++) {
          await prisma.trainSeat.create({
            data: {
              scheduleId: schedule.id,
              seatNumber: trainSeats[i],
              isBooked: isDeterministicBooked(i, scheduleIndex)
            }
          });
        }

        trainScheduleCount++;
        scheduleIndex++;
      }
    }
  }

  // Final summary
  const totalBusOperators = await prisma.busOperator.count();
  const totalTrainOperators = await prisma.trainOperator.count();
  const totalBusSeats = await prisma.busSeat.count();
  const totalTrainSeats = await prisma.trainSeat.count();
  const totalUsers = await prisma.user.count();

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  • Bus Operators: ${totalBusOperators}`);
  console.log(`  • Train Operators: ${totalTrainOperators}`);
  console.log(`  • Bus Schedules: ${busScheduleCount}`);
  console.log(`  • Train Schedules: ${trainScheduleCount}`);
  console.log(`  • Total Schedules: ${busScheduleCount + trainScheduleCount}`);
  console.log(`  • Bus Seats: ${totalBusSeats}`);
  console.log(`  • Train Seats: ${totalTrainSeats}`);
  console.log(`  • Users: ${totalUsers}`);
  console.log('\n✨ Demo accounts ready for use!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
