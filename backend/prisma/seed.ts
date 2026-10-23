import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script for JalanYuk platform (Development Mode)
 * 
 * WARNING: This seed script deletes existing schedules, seats and ALL demo
 * booking data (bookings, payments, reservations) to ensure fresh,
 * relative-dated schedules. Only run where that reset is acceptable.
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
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bookingItem.deleteMany({});
  await prisma.passenger.deleteMany({});
  await prisma.seatReservation.deleteMany({});
  await prisma.booking.deleteMany({});
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

  // STEP 4: Bus Operators, Buses, Terminals, Routes (data-driven)
  console.log('🚌 Creating bus operators, buses, terminals and routes...');

  const busOperatorsData = [
    { code: 'RI', name: 'Rosalia Indah', description: 'PO bus antarkota berpengalaman sejak 1980-an (Data Simulasi)' },
    { code: 'SJ', name: 'Sinar Jaya', description: 'PO bus dengan jaringan luas di Jawa (Data Simulasi)' },
    { code: 'GH', name: 'Gunung Harta', description: 'Spesialis rute Jawa-Bali (Data Simulasi)' },
    { code: 'PH', name: 'PO Haryanto', description: 'PO bus asal Kudus, kuat di Pantura (Data Simulasi)' },
    { code: 'LR', name: 'Lorena', description: 'PO bus antarkota dan pariwisata (Data Simulasi)' },
    { code: 'KD', name: 'Kramat Djati', description: 'PO bus legendaris lintas Jawa (Data Simulasi)' },
    { code: 'MT', name: 'M Trans', description: 'Bus sleeper premium Jawa-Bali (Data Simulasi)' },
    { code: 'SDR', name: 'Safari Dharma Raya', description: 'PO bus Jawa-Bali-NTB (Data Simulasi)' },
    { code: 'TM', name: 'Tiara Mas', description: 'Spesialis trayek Jawa-Bali-Lombok-Sumbawa (Data Simulasi)' },
    { code: 'DM', name: 'Damri', description: 'Perum Damri - BUMN transportasi darat (Data Simulasi)' },
    { code: 'EF', name: 'Efisiensi', description: 'PO bus Jawa Tengah dan DIY (Data Simulasi)' },
    { code: 'STJ', name: 'Sudiro Tungga Jaya', description: 'PO bus premium asal Magetan (Data Simulasi)' },
    { code: 'PK', name: 'Pahala Kencana', description: 'PO bus lintas Jawa-Bali (Data Simulasi)' },
  ];
  const busOperatorByCode: Record<string, any> = {};
  for (const op of busOperatorsData) {
    busOperatorByCode[op.code] = await prisma.busOperator.upsert({
      where: { code: op.code },
      update: {},
      create: { ...op, isActive: true },
    });
  }

  const seatLayout = { rows: 10, cols: 4, aisleAfter: 2 };
  const FAC_EXEC = ['AC', 'Toilet', 'Reclining Seat', 'Snack'];
  const FAC_SUPER = ['AC', 'Toilet', 'Reclining Seat', 'Snack', 'WiFi', 'Charging Port'];
  const FAC_SLEEPER = ['AC', 'Toilet', 'Sleeper Seat', 'Blanket', 'Snack', 'Charging Port'];
  const FAC_ECO = ['AC', 'Standard Seat'];

  const busesData = [
    { id: 'bus-ri-1', op: 'RI', name: 'Rosalia Indah Eksekutif 001', plate: 'B 1234 RI', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-ri-2', op: 'RI', name: 'Rosalia Indah Super Eksekutif 002', plate: 'B 2234 RI', className: 'Super Eksekutif', facilities: FAC_SUPER },
    { id: 'bus-sj-1', op: 'SJ', name: 'Sinar Jaya Super Eksekutif 001', plate: 'B 5678 SJ', className: 'Super Eksekutif', facilities: FAC_SUPER },
    { id: 'bus-sj-2', op: 'SJ', name: 'Sinar Jaya Ekonomi AC 002', plate: 'B 6678 SJ', className: 'Ekonomi AC', facilities: FAC_ECO },
    { id: 'bus-gh-1', op: 'GH', name: 'Gunung Harta Eksekutif 001', plate: 'D 9999 GH', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-ph-1', op: 'PH', name: 'PO Haryanto Eksekutif 001', plate: 'B 7001 PH', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-lr-1', op: 'LR', name: 'Lorena Eksekutif 001', plate: 'B 7002 LR', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-kd-1', op: 'KD', name: 'Kramat Djati Eksekutif 001', plate: 'B 7003 KD', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-mt-1', op: 'MT', name: 'M Trans Sleeper 001', plate: 'DK 7004 MT', className: 'Sleeper', facilities: FAC_SLEEPER },
    { id: 'bus-sdr-1', op: 'SDR', name: 'Safari Dharma Raya Eksekutif 001', plate: 'DK 7005 SR', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-tm-1', op: 'TM', name: 'Tiara Mas Super Eksekutif 001', plate: 'EA 7006 TM', className: 'Super Eksekutif', facilities: FAC_SUPER },
    { id: 'bus-dm-1', op: 'DM', name: 'Damri Eksekutif 001', plate: 'B 7007 DM', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-ef-1', op: 'EF', name: 'Efisiensi Eksekutif 001', plate: 'AA 7008 EF', className: 'Eksekutif', facilities: FAC_EXEC },
    { id: 'bus-stj-1', op: 'STJ', name: 'Sudiro Tungga Jaya Super Eksekutif 001', plate: 'AE 7009 SJ', className: 'Super Eksekutif', facilities: FAC_SUPER },
    { id: 'bus-pk-1', op: 'PK', name: 'Pahala Kencana Eksekutif 001', plate: 'DK 7010 PK', className: 'Eksekutif', facilities: FAC_EXEC },
  ];
  const busById: Record<string, any> = {};
  for (const bus of busesData) {
    busById[bus.id] = await prisma.bus.upsert({
      where: { id: bus.id },
      update: {},
      create: {
        id: bus.id,
        operatorId: busOperatorByCode[bus.op].id,
        name: bus.name,
        plateNumber: bus.plate,
        capacity: 40,
        seatLayout,
        facilities: bus.facilities,
        className: bus.className,
        isActive: true,
      },
    });
  }

  const terminalsData = [
    { id: 'terminal-kr', name: 'Terminal Kampung Rambutan', city: 'Jakarta', address: 'Jl. Raya Bogor KM 23, Jakarta Timur' },
    { id: 'terminal-pg', name: 'Terminal Pulogebang', city: 'Jakarta', address: 'Jl. Bekasi Timur Raya, Jakarta Timur' },
    { id: 'terminal-bks', name: 'Terminal Bekasi', city: 'Bekasi', address: 'Jl. Ahmad Yani, Bekasi' },
    { id: 'terminal-bgr', name: 'Terminal Baranangsiang', city: 'Bogor', address: 'Jl. Pajajaran, Bogor' },
    { id: 'terminal-dpk', name: 'Terminal Jatijajar', city: 'Depok', address: 'Jl. Raya Jakarta-Bogor, Depok' },
    { id: 'terminal-tng', name: 'Terminal Poris Plawad', city: 'Tangerang', address: 'Poris Plawad, Tangerang' },
    { id: 'terminal-lp', name: 'Terminal Leuwi Panjang', city: 'Bandung', address: 'Jl. Soekarno-Hatta, Bandung' },
    { id: 'terminal-cbn', name: 'Terminal Harjamukti', city: 'Cirebon', address: 'Jl. Ahmad Yani, Cirebon' },
    { id: 'terminal-teg', name: 'Terminal Tegal', city: 'Tegal', address: 'Jl. Kolonel Sudiarto, Tegal' },
    { id: 'terminal-pwt', name: 'Terminal Bulupitu', city: 'Purwokerto', address: 'Jl. Gerilya, Purwokerto' },
    { id: 'terminal-smg', name: 'Terminal Terboyo', city: 'Semarang', address: 'Jl. Kaligawe Raya, Semarang' },
    { id: 'terminal-tn', name: 'Terminal Tirtonadi', city: 'Solo', address: 'Jl. Ahmad Yani, Solo' },
    { id: 'terminal-yog', name: 'Terminal Giwangan', city: 'Yogyakarta', address: 'Jl. Imogiri Timur, Yogyakarta' },
    { id: 'terminal-mdn', name: 'Terminal Purboyo', city: 'Madiun', address: 'Jl. Basuki Rahmat, Madiun' },
    { id: 'terminal-kdr', name: 'Terminal Tamanan', city: 'Kediri', address: 'Jl. Semeru, Kediri' },
    { id: 'terminal-mlg', name: 'Terminal Arjosari', city: 'Malang', address: 'Jl. Raden Intan, Malang' },
    { id: 'terminal-pro', name: 'Terminal Bayuangga', city: 'Probolinggo', address: 'Jl. Sukarno-Hatta, Probolinggo' },
    { id: 'terminal-jmb', name: 'Terminal Tawang Alun', city: 'Jember', address: 'Jl. Otto Iskandardinata, Jember' },
    { id: 'terminal-bwi', name: 'Terminal Brawijaya', city: 'Banyuwangi', address: 'Jl. Gatot Subroto, Banyuwangi' },
    { id: 'terminal-br', name: 'Terminal Bungurasih', city: 'Surabaya', address: 'Jl. Ir. H. Juanda, Sidoarjo' },
    { id: 'terminal-dps', name: 'Terminal Mengwi', city: 'Denpasar', address: 'Jl. Raya Denpasar-Gilimanuk, Badung' },
    { id: 'terminal-mtr', name: 'Terminal Mandalika', city: 'Mataram', address: 'Jl. Raya Mataram, Lombok Barat' },
    { id: 'terminal-sbw', name: 'Terminal Sumbawa Besar', city: 'Sumbawa Besar', address: 'Jl. Lintas Sumbawa, Sumbawa' },
    { id: 'terminal-bim', name: 'Terminal Dara', city: 'Bima', address: 'Jl. Sultan Salahuddin, Bima' },
  ];
  const terminalById: Record<string, any> = {};
  for (const t of terminalsData) {
    terminalById[t.id] = await prisma.busTerminal.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, isActive: true },
    });
  }

  type BusTier = 'trunk' | 'regular' | 'thin';
  const busRoutesData: {
    id: string; from: string; to: string; km: number; min: number; bus: string; tier: BusTier; price?: number;
  }[] = [
    { id: 'route-bus-jkt-bdg', from: 'terminal-kr', to: 'terminal-lp', km: 150, min: 180, bus: 'bus-ri-1', tier: 'trunk' },
    { id: 'route-bus-bdg-jkt', from: 'terminal-lp', to: 'terminal-kr', km: 150, min: 180, bus: 'bus-ri-1', tier: 'trunk' },
    { id: 'route-bus-jkt-sby', from: 'terminal-pg', to: 'terminal-br', km: 700, min: 660, bus: 'bus-sj-1', tier: 'trunk' },
    { id: 'route-bus-sby-jkt', from: 'terminal-br', to: 'terminal-pg', km: 700, min: 660, bus: 'bus-sj-1', tier: 'trunk' },
    { id: 'route-bus-bks-solo', from: 'terminal-bks', to: 'terminal-tn', km: 550, min: 540, bus: 'bus-gh-1', tier: 'regular' },
    { id: 'route-bus-jkt-smg', from: 'terminal-pg', to: 'terminal-smg', km: 450, min: 420, bus: 'bus-ph-1', tier: 'trunk' },
    { id: 'route-bus-smg-jkt', from: 'terminal-smg', to: 'terminal-pg', km: 450, min: 420, bus: 'bus-ph-1', tier: 'trunk' },
    { id: 'route-bus-jkt-yog', from: 'terminal-pg', to: 'terminal-yog', km: 560, min: 540, bus: 'bus-ri-2', tier: 'trunk' },
    { id: 'route-bus-yog-jkt', from: 'terminal-yog', to: 'terminal-pg', km: 560, min: 540, bus: 'bus-ri-2', tier: 'trunk' },
    { id: 'route-bus-jkt-solo', from: 'terminal-pg', to: 'terminal-tn', km: 580, min: 540, bus: 'bus-stj-1', tier: 'trunk' },
    { id: 'route-bus-jkt-mlg', from: 'terminal-pg', to: 'terminal-mlg', km: 800, min: 780, bus: 'bus-sj-1', tier: 'regular' },
    { id: 'route-bus-mlg-jkt', from: 'terminal-mlg', to: 'terminal-pg', km: 800, min: 780, bus: 'bus-sj-1', tier: 'regular' },
    { id: 'route-bus-jkt-cbn', from: 'terminal-kr', to: 'terminal-cbn', km: 220, min: 240, bus: 'bus-ef-1', tier: 'regular' },
    { id: 'route-bus-jkt-bgr', from: 'terminal-kr', to: 'terminal-bgr', km: 60, min: 90, bus: 'bus-dm-1', tier: 'regular' },
    { id: 'route-bus-jkt-pwt', from: 'terminal-kr', to: 'terminal-pwt', km: 350, min: 330, bus: 'bus-ef-1', tier: 'regular' },
    { id: 'route-bus-jkt-dps', from: 'terminal-pg', to: 'terminal-dps', km: 1150, min: 1080, bus: 'bus-mt-1', tier: 'regular' },
    { id: 'route-bus-dps-jkt', from: 'terminal-dps', to: 'terminal-pg', km: 1150, min: 1080, bus: 'bus-mt-1', tier: 'regular' },
    { id: 'route-bus-jkt-mtr', from: 'terminal-pg', to: 'terminal-mtr', km: 1350, min: 1560, bus: 'bus-tm-1', tier: 'thin' },
    { id: 'route-bus-bdg-smg', from: 'terminal-lp', to: 'terminal-smg', km: 360, min: 360, bus: 'bus-kd-1', tier: 'regular' },
    { id: 'route-bus-bdg-yog', from: 'terminal-lp', to: 'terminal-yog', km: 420, min: 420, bus: 'bus-lr-1', tier: 'regular' },
    { id: 'route-bus-bdg-sby', from: 'terminal-lp', to: 'terminal-br', km: 700, min: 660, bus: 'bus-gh-1', tier: 'regular' },
    { id: 'route-bus-bdg-mlg', from: 'terminal-lp', to: 'terminal-mlg', km: 650, min: 660, bus: 'bus-lr-1', tier: 'regular' },
    { id: 'route-bus-smg-sby', from: 'terminal-smg', to: 'terminal-br', km: 350, min: 330, bus: 'bus-ph-1', tier: 'regular' },
    { id: 'route-bus-smg-yog', from: 'terminal-smg', to: 'terminal-yog', km: 130, min: 150, bus: 'bus-ef-1', tier: 'regular' },
    { id: 'route-bus-yog-mlg', from: 'terminal-yog', to: 'terminal-mlg', km: 400, min: 420, bus: 'bus-sdr-1', tier: 'regular' },
    { id: 'route-bus-yog-dps', from: 'terminal-yog', to: 'terminal-dps', km: 650, min: 780, bus: 'bus-pk-1', tier: 'regular' },
    { id: 'route-bus-sby-mlg', from: 'terminal-br', to: 'terminal-mlg', km: 100, min: 150, bus: 'bus-sj-2', tier: 'regular' },
    { id: 'route-bus-sby-bwi', from: 'terminal-br', to: 'terminal-bwi', km: 290, min: 330, bus: 'bus-dm-1', tier: 'regular' },
    { id: 'route-bus-sby-dps', from: 'terminal-br', to: 'terminal-dps', km: 450, min: 600, bus: 'bus-gh-1', tier: 'regular' },
    { id: 'route-bus-dps-sby', from: 'terminal-dps', to: 'terminal-br', km: 450, min: 600, bus: 'bus-gh-1', tier: 'regular' },
    { id: 'route-bus-sby-mtr', from: 'terminal-br', to: 'terminal-mtr', km: 650, min: 900, bus: 'bus-tm-1', tier: 'thin' },
    { id: 'route-bus-solo-dps', from: 'terminal-tn', to: 'terminal-dps', km: 620, min: 720, bus: 'bus-ri-2', tier: 'regular' },
    { id: 'route-bus-mlg-dps', from: 'terminal-mlg', to: 'terminal-dps', km: 400, min: 540, bus: 'bus-mt-1', tier: 'regular' },
    { id: 'route-bus-bwi-dps', from: 'terminal-bwi', to: 'terminal-dps', km: 130, min: 270, bus: 'bus-pk-1', tier: 'regular' },
    { id: 'route-bus-dps-mtr', from: 'terminal-dps', to: 'terminal-mtr', km: 180, min: 330, bus: 'bus-tm-1', tier: 'thin' },
    { id: 'route-bus-mtr-sbw', from: 'terminal-mtr', to: 'terminal-sbw', km: 190, min: 300, bus: 'bus-tm-1', tier: 'thin' },
    { id: 'route-bus-mtr-bim', from: 'terminal-mtr', to: 'terminal-bim', km: 280, min: 480, bus: 'bus-tm-1', tier: 'thin' },
  ];
  const busRouteById: Record<string, any> = {};
  for (const r of busRoutesData) {
    busRouteById[r.id] = await prisma.busRoute.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        originTerminalId: terminalById[r.from].id,
        destinationTerminalId: terminalById[r.to].id,
        distanceKm: r.km,
        durationMinutes: r.min,
      },
    });
  }

  // STEP 5: Train Operator, Stations, Trains, Routes (data-driven)
  console.log('🚆 Creating train operator, stations, trains and routes...');

  const ptKai = await prisma.trainOperator.upsert({
    where: { code: 'KAI' },
    update: {},
    create: { name: 'PT KAI (Data Simulasi)', code: 'KAI', isActive: true },
  });

  const stationsData = [
    { code: 'GMR', name: 'Gambir', city: 'Jakarta', address: 'Jl. Medan Merdeka Timur, Jakarta Pusat' },
    { code: 'PSE', name: 'Pasar Senen', city: 'Jakarta', address: 'Jl. Pasar Senen, Jakarta Pusat' },
    { code: 'BKS', name: 'Bekasi', city: 'Bekasi', address: 'Jl. Perjuangan, Bekasi' },
    { code: 'CKP', name: 'Cikampek', city: 'Karawang', address: 'Jl. Stasiun, Cikampek' },
    { code: 'CN', name: 'Cirebon', city: 'Cirebon', address: 'Jl. Siliwangi, Cirebon' },
    { code: 'TG', name: 'Tegal', city: 'Tegal', address: 'Jl. Semeru, Tegal' },
    { code: 'PK', name: 'Pekalongan', city: 'Pekalongan', address: 'Jl. Gajah Mada, Pekalongan' },
    { code: 'SMT', name: 'Semarang Tawang', city: 'Semarang', address: 'Jl. Taman Tawang, Semarang' },
    { code: 'PWT', name: 'Purwokerto', city: 'Purwokerto', address: 'Jl. Jenderal Sudirman, Purwokerto' },
    { code: 'KYA', name: 'Kroya', city: 'Cilacap', address: 'Jl. Stasiun, Kroya' },
    { code: 'KTJ', name: 'Kutoarjo', city: 'Purworejo', address: 'Jl. Stasiun, Kutoarjo' },
    { code: 'TSM', name: 'Tasikmalaya', city: 'Tasikmalaya', address: 'Jl. Stasiun, Tasikmalaya' },
    { code: 'BD', name: 'Bandung', city: 'Bandung', address: 'Jl. Kebon Kawung, Bandung' },
    { code: 'KAC', name: 'Kiaracondong', city: 'Bandung', address: 'Jl. Kiaracondong, Bandung' },
    { code: 'YK', name: 'Yogyakarta', city: 'Yogyakarta', address: 'Jl. Pasar Kembang, Yogyakarta' },
    { code: 'LPN', name: 'Lempuyangan', city: 'Yogyakarta', address: 'Jl. Hayam Wuruk, Yogyakarta' },
    { code: 'KLT', name: 'Klaten', city: 'Klaten', address: 'Jl. Stasiun, Klaten' },
    { code: 'SLO', name: 'Solo Balapan', city: 'Solo', address: 'Jl. Wolter Monginsidi, Solo' },
    { code: 'MN', name: 'Madiun', city: 'Madiun', address: 'Jl. Kompol Sunaryo, Madiun' },
    { code: 'KD', name: 'Kediri', city: 'Kediri', address: 'Jl. Stasiun, Kediri' },
    { code: 'BL', name: 'Blitar', city: 'Blitar', address: 'Jl. Mastrip, Blitar' },
    { code: 'KTS', name: 'Kertosono', city: 'Nganjuk', address: 'Jl. Stasiun, Kertosono' },
    { code: 'JG', name: 'Jombang', city: 'Jombang', address: 'Jl. Adityawarman, Jombang' },
    { code: 'SGU', name: 'Surabaya Gubeng', city: 'Surabaya', address: 'Jl. Gubernur Suryo, Surabaya' },
    { code: 'SBI', name: 'Surabaya Pasar Turi', city: 'Surabaya', address: 'Jl. Semarang, Surabaya' },
    { code: 'SDJ', name: 'Sidoarjo', city: 'Sidoarjo', address: 'Jl. Stasiun, Sidoarjo' },
    { code: 'ML', name: 'Malang', city: 'Malang', address: 'Jl. Trunojoyo, Malang' },
    { code: 'PB', name: 'Probolinggo', city: 'Probolinggo', address: 'Jl. KH Mas Mansyur, Probolinggo' },
    { code: 'JR', name: 'Jember', city: 'Jember', address: 'Jl. Wijaya Kusuma, Jember' },
    { code: 'KTG', name: 'Ketapang', city: 'Banyuwangi', address: 'Jl. Gatot Subroto, Banyuwangi' },
  ];
  const stationByCode: Record<string, any> = {};
  for (const s of stationsData) {
    stationByCode[s.code] = await prisma.trainStation.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, isActive: true },
    });
  }

  const TRAIN_FAC_EXEC = ['AC', 'Reclining Seat', 'Meal', 'Power Outlet'];
  const TRAIN_FAC_PREMIUM = ['AC', 'Reclining Seat', 'Power Outlet'];
  const TRAIN_FAC_ECO = ['AC', 'Standard Seat'];
  const trainsData = [
    { id: 'train-argo-1', name: 'Argo Parahyangan (Simulasi)', number: 'KA 36', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-taksaka-1', name: 'Taksaka (Simulasi)', number: 'KA 68', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-lodaya-1', name: 'Lodaya (Simulasi)', number: 'KA 92', className: 'Ekonomi Premium', facilities: TRAIN_FAC_PREMIUM },
    { id: 'train-anggrek-1', name: 'Argo Bromo Anggrek (Simulasi)', number: 'KA 2', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-muria-1', name: 'Argo Muria (Simulasi)', number: 'KA 14', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-merbabu-1', name: 'Argo Merbabu (Simulasi)', number: 'KA 22', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-dwipangga-1', name: 'Argo Dwipangga (Simulasi)', number: 'KA 10', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-gajayana-1', name: 'Gajayana (Simulasi)', number: 'KA 56', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-semeru-1', name: 'Argo Semeru (Simulasi)', number: 'KA 18', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-bima-1', name: 'Bima (Simulasi)', number: 'KA 60', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-pandalungan-1', name: 'Pandalungan (Simulasi)', number: 'KA 32', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-turangga-1', name: 'Turangga (Simulasi)', number: 'KA 66', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-wilis-1', name: 'Argo Wilis (Simulasi)', number: 'KA 6', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-malabar-1', name: 'Malabar (Simulasi)', number: 'KA 122', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-kahuripan-1', name: 'Kahuripan (Simulasi)', number: 'KA 282', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-fajar-1', name: 'Fajar Utama YK (Simulasi)', number: 'KA 110', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-senja-1', name: 'Senja Utama Solo (Simulasi)', number: 'KA 258', className: 'Ekonomi Premium', facilities: TRAIN_FAC_PREMIUM },
    { id: 'train-bengawan-1', name: 'Bengawan (Simulasi)', number: 'KA 292', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-airlangga-1', name: 'Airlangga (Simulasi)', number: 'KA 236', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-kertajaya-1', name: 'Kertajaya (Simulasi)', number: 'KA 252', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-matarmaja-1', name: 'Matarmaja (Simulasi)', number: 'KA 284', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-jayakarta-1', name: 'Jayakarta (Simulasi)', number: 'KA 260', className: 'Ekonomi Premium', facilities: TRAIN_FAC_PREMIUM },
    { id: 'train-blambangan-1', name: 'Blambangan Ekspres (Simulasi)', number: 'KA 186', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-menoreh-1', name: 'Menoreh (Simulasi)', number: 'KA 226', className: 'Ekonomi Premium', facilities: TRAIN_FAC_PREMIUM },
    { id: 'train-cheribon-1', name: 'Argo Cheribon (Simulasi)', number: 'KA 24', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-sancaka-1', name: 'Sancaka (Simulasi)', number: 'KA 82', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-sritanjung-1', name: 'Sri Tanjung (Simulasi)', number: 'KA 302', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-logawa-1', name: 'Logawa (Simulasi)', number: 'KA 248', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-ambarawa-1', name: 'Ambarawa Ekspres (Simulasi)', number: 'KA 264', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-probowangi-1', name: 'Probowangi (Simulasi)', number: 'KA 314', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
    { id: 'train-mutiara-1', name: 'Mutiara Timur (Simulasi)', number: 'KA 210', className: 'Eksekutif', facilities: TRAIN_FAC_EXEC },
    { id: 'train-tawangalun-1', name: 'Tawang Alun (Simulasi)', number: 'KA 316', className: 'Ekonomi', facilities: TRAIN_FAC_ECO },
  ];
  const trainById: Record<string, any> = {};
  for (const t of trainsData) {
    trainById[t.id] = await prisma.train.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        operatorId: ptKai.id,
        name: t.name,
        trainNumber: t.number,
        className: t.className,
        capacity: 64,
        facilities: t.facilities,
        isActive: true,
      },
    });
  }

  const trainRoutesData: {
    id: string; from: string; to: string; km: number; min: number; train: string; price: number; times: string[];
  }[] = [
    { id: 'route-train-gmr-bd', from: 'GMR', to: 'BD', km: 150, min: 180, train: 'train-argo-1', price: 150000, times: ['06:45', '09:15', '15:30'] },
    { id: 'route-train-bd-gmr', from: 'BD', to: 'GMR', km: 150, min: 180, train: 'train-argo-1', price: 150000, times: ['07:10', '10:05', '16:10'] },
    { id: 'route-train-gmr-yk', from: 'GMR', to: 'YK', km: 530, min: 450, train: 'train-taksaka-1', price: 470000, times: ['08:00', '20:45'] },
    { id: 'route-train-pse-yk', from: 'PSE', to: 'YK', km: 500, min: 480, train: 'train-fajar-1', price: 360000, times: ['06:30', '19:05'] },
    { id: 'route-train-gmr-sgu', from: 'GMR', to: 'SGU', km: 700, min: 540, train: 'train-semeru-1', price: 560000, times: ['06:20'] },
    { id: 'route-train-sgu-gmr', from: 'SGU', to: 'GMR', km: 760, min: 600, train: 'train-bima-1', price: 560000, times: ['17:05'] },
    { id: 'route-train-gmr-sbi', from: 'GMR', to: 'SBI', km: 780, min: 480, train: 'train-anggrek-1', price: 675000, times: ['08:20', '20:35'] },
    { id: 'route-train-gmr-smt', from: 'GMR', to: 'SMT', km: 450, min: 300, train: 'train-muria-1', price: 340000, times: ['06:55', '16:45'] },
    { id: 'route-train-smt-gmr', from: 'SMT', to: 'GMR', km: 450, min: 300, train: 'train-merbabu-1', price: 340000, times: ['05:50'] },
    { id: 'route-train-gmr-slo', from: 'GMR', to: 'SLO', km: 570, min: 420, train: 'train-dwipangga-1', price: 560000, times: ['08:50', '19:40'] },
    { id: 'route-train-gmr-ml', from: 'GMR', to: 'ML', km: 900, min: 660, train: 'train-gajayana-1', price: 660000, times: ['17:45'] },
    { id: 'route-train-gmr-jr', from: 'GMR', to: 'JR', km: 950, min: 780, train: 'train-pandalungan-1', price: 540000, times: ['07:15'] },
    { id: 'route-train-gmr-cn', from: 'GMR', to: 'CN', km: 220, min: 200, train: 'train-cheribon-1', price: 130000, times: ['09:05', '17:30'] },
    { id: 'route-train-cn-gmr', from: 'CN', to: 'GMR', km: 220, min: 200, train: 'train-cheribon-1', price: 130000, times: ['06:10', '14:20'] },
    { id: 'route-train-pse-slo-bengawan', from: 'PSE', to: 'SLO', km: 570, min: 540, train: 'train-bengawan-1', price: 105000, times: ['06:25'] },
    { id: 'route-train-pse-slo-senja', from: 'PSE', to: 'SLO', km: 570, min: 510, train: 'train-senja-1', price: 300000, times: ['18:55'] },
    { id: 'route-train-pse-sbi-airlangga', from: 'PSE', to: 'SBI', km: 720, min: 660, train: 'train-airlangga-1', price: 135000, times: ['11:15'] },
    { id: 'route-train-pse-sbi-kertajaya', from: 'PSE', to: 'SBI', km: 720, min: 630, train: 'train-kertajaya-1', price: 230000, times: ['21:35'] },
    { id: 'route-train-pse-ml-matarmaja', from: 'PSE', to: 'ML', km: 880, min: 840, train: 'train-matarmaja-1', price: 245000, times: ['15:15'] },
    { id: 'route-train-pse-sgu-jayakarta', from: 'PSE', to: 'SGU', km: 820, min: 720, train: 'train-jayakarta-1', price: 265000, times: ['17:10'] },
    { id: 'route-train-pse-ktg-blambangan', from: 'PSE', to: 'KTG', km: 1050, min: 900, train: 'train-blambangan-1', price: 355000, times: ['19:25'] },
    { id: 'route-train-pse-smt-menoreh', from: 'PSE', to: 'SMT', km: 450, min: 390, train: 'train-menoreh-1', price: 210000, times: ['06:15'] },
    { id: 'route-train-bd-sgu-turangga', from: 'BD', to: 'SGU', km: 780, min: 660, train: 'train-turangga-1', price: 460000, times: ['19:35'] },
    { id: 'route-train-bd-sgu-wilis', from: 'BD', to: 'SGU', km: 780, min: 690, train: 'train-wilis-1', price: 480000, times: ['07:35'] },
    { id: 'route-train-bd-ml-malabar', from: 'BD', to: 'ML', km: 800, min: 840, train: 'train-malabar-1', price: 360000, times: ['17:20'] },
    { id: 'route-train-bd-bl-kahuripan', from: 'BD', to: 'BL', km: 690, min: 780, train: 'train-kahuripan-1', price: 155000, times: ['21:40'] },
    { id: 'route-train-bd-slo-lodaya', from: 'BD', to: 'SLO', km: 570, min: 540, train: 'train-lodaya-1', price: 290000, times: ['07:05', '20:20'] },
    { id: 'route-train-yk-sgu-sancaka', from: 'YK', to: 'SGU', km: 310, min: 270, train: 'train-sancaka-1', price: 255000, times: ['06:45', '17:10'] },
    { id: 'route-train-yk-ktg-sritanjung', from: 'YK', to: 'KTG', km: 520, min: 480, train: 'train-sritanjung-1', price: 125000, times: ['13:05'] },
    { id: 'route-train-pwt-jr-logawa', from: 'PWT', to: 'JR', km: 580, min: 600, train: 'train-logawa-1', price: 185000, times: ['05:35'] },
    { id: 'route-train-smt-sbi-ambarawa', from: 'SMT', to: 'SBI', km: 360, min: 300, train: 'train-ambarawa-1', price: 185000, times: ['07:20', '15:45'] },
    { id: 'route-train-sgu-ktg-probowangi', from: 'SGU', to: 'KTG', km: 300, min: 270, train: 'train-probowangi-1', price: 105000, times: ['07:25'] },
    { id: 'route-train-sgu-ktg-mutiara', from: 'SGU', to: 'KTG', km: 300, min: 240, train: 'train-mutiara-1', price: 190000, times: ['09:35'] },
    { id: 'route-train-ml-ktg-tawangalun', from: 'ML', to: 'KTG', km: 320, min: 330, train: 'train-tawangalun-1', price: 95000, times: ['16:05'] },
  ];
  const trainRouteById: Record<string, any> = {};
  for (const r of trainRoutesData) {
    trainRouteById[r.id] = await prisma.trainRoute.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        originStationId: stationByCode[r.from].id,
        destinationStationId: stationByCode[r.to].id,
        distanceKm: r.km,
        durationMinutes: r.min,
      },
    });
  }

  // STEP 6: Generate schedules — 12-day rolling window, times are Asia/Jakarta
  // wall-clock times converted to UTC (WIB = UTC+7) so search-by-date and the
  // displayed times agree with the user's calendar.
  console.log('📅 Generating schedules (12-day rolling window)...');

  const classFactor: Record<string, number> = {
    'Super Eksekutif': 1.2,
    Sleeper: 1.35,
    Eksekutif: 1.0,
    Bisnis: 0.85,
    'Ekonomi Premium': 0.9,
    'Ekonomi AC': 0.7,
    Ekonomi: 0.75,
  };
  const round1000 = (n: number) => Math.round(n / 1000) * 1000;

  function departureUTC(dayOffset: number, jakartaTime: string): Date {
    const [h, m] = jakartaTime.split(':').map(Number);
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset, h - 7, m));
  }

  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  function daysForBus(tier: BusTier): number[] {
    if (tier === 'trunk') return ALL_DAYS;
    if (tier === 'regular') return [0, 1, 2, 4, 5, 6, 8, 9, 10, 11];
    return [0, 1, 2, 4, 6, 7, 9, 10];
  }
  const BUS_TIME_POOL = ['06:00', '07:30', '09:00', '11:00', '13:00', '16:00', '19:00', '20:30'];
  function timesForBus(tier: BusTier, routeIndex: number): string[] {
    const start = routeIndex % BUS_TIME_POOL.length;
    const pick = (n: number) =>
      Array.from({ length: n }, (_, i) => BUS_TIME_POOL[(start + i * 2) % BUS_TIME_POOL.length]);
    if (tier === 'trunk') return pick(3);
    if (tier === 'regular') return pick(2);
    return pick(1);
  }

  let busScheduleCount = 0;
  let trainScheduleCount = 0;
  let scheduleIndex = 0;

  for (let ri = 0; ri < busRoutesData.length; ri++) {
    const cfg = busRoutesData[ri];
    const route = busRouteById[cfg.id];
    const bus = busById[cfg.bus];
    const price = cfg.price ?? round1000(priceFor('BUS', cfg.min) * (classFactor[bus.className] ?? 1));
    for (const dayOffset of daysForBus(cfg.tier)) {
      for (const time of timesForBus(cfg.tier, ri)) {
        const departureTime = departureUTC(dayOffset, time);
        const arrivalTime = new Date(departureTime.getTime() + cfg.min * 60000);
        const schedule = await prisma.busSchedule.create({
          data: {
            operatorId: bus.operatorId,
            busId: bus.id,
            routeId: route.id,
            departureTerminalId: route.originTerminalId,
            arrivalTerminalId: route.destinationTerminalId,
            departureTime,
            arrivalTime,
            price,
            status: 'ACTIVE',
          },
        });
        const seatNumbers = generateBusSeats();
        await prisma.busSeat.createMany({
          data: seatNumbers.map((seatNumber, i) => ({
            scheduleId: schedule.id,
            seatNumber,
            isBooked: isDeterministicBooked(i, scheduleIndex),
          })),
        });
        busScheduleCount++;
        scheduleIndex++;
      }
    }
  }

  for (const cfg of trainRoutesData) {
    const route = trainRouteById[cfg.id];
    const train = trainById[cfg.train];
    for (const dayOffset of ALL_DAYS) {
      for (const time of cfg.times) {
        const departureTime = departureUTC(dayOffset, time);
        const arrivalTime = new Date(departureTime.getTime() + cfg.min * 60000);
        const schedule = await prisma.trainSchedule.create({
          data: {
            operatorId: train.operatorId,
            trainId: train.id,
            routeId: route.id,
            departureStationId: route.originStationId,
            arrivalStationId: route.destinationStationId,
            departureTime,
            arrivalTime,
            price: cfg.price,
            status: 'ACTIVE',
          },
        });
        const seatNumbers = generateTrainSeats();
        await prisma.trainSeat.createMany({
          data: seatNumbers.map((seatNumber, i) => ({
            scheduleId: schedule.id,
            seatNumber,
            isBooked: isDeterministicBooked(i, scheduleIndex),
          })),
        });
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
