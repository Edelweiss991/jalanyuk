import { describe, it, expect } from 'vitest';
import { mergeSortWithLog, mergeSort } from '../src/algorithms/mergeSort';
import { bubbleSortWithLog } from '../src/algorithms/bubbleSort';
import { linearSearchWithLog } from '../src/algorithms/linearSearch';
import { binarySearchWithLog } from '../src/algorithms/binarySearch';

const prices = (arr: number[]) => arr.map((price) => ({ price }));

describe('Merge Sort (manual)', () => {
  it('mengurutkan harga dengan benar', () => {
    const items = prices([300000, 100000, 250000, 75000, 430000, 190000]);
    const { sorted, comparisons } = mergeSortWithLog(items, (i) => i.price, 'BUS');
    expect(sorted.map((i) => i.price)).toEqual([75000, 100000, 190000, 250000, 300000, 430000]);
    expect(comparisons).toBeGreaterThan(0);
  });

  it('menghasilkan log langkah nyata', () => {
    const { log } = mergeSortWithLog(prices([3, 1, 2]), (i) => i.price, 'BUS');
    expect(log.length).toBeGreaterThan(0);
    expect(log[0]).toHaveProperty('step');
    expect(log[0]).toHaveProperty('algorithm');
  });

  it('menangani dataset kosong & satu elemen & duplikat', () => {
    expect(mergeSortWithLog([], (i: { price: number }) => i.price, 'BUS').sorted).toEqual([]);
    expect(mergeSortWithLog(prices([5]), (i) => i.price, 'BUS').sorted.map((i) => i.price)).toEqual([5]);
    expect(mergeSort(prices([2, 2, 1, 1]), (i) => i.price).map((i) => i.price)).toEqual([1, 1, 2, 2]);
  });

  it('hasil sama dengan urutan referensi untuk data acak deterministik', () => {
    const items = prices(Array.from({ length: 40 }, (_, i) => ((i * 7919) % 500) * 1000));
    const expected = [...items].sort((a, b) => a.price - b.price).map((i) => i.price);
    expect(mergeSort(items, (i) => i.price).map((i) => i.price)).toEqual(expected);
  });
});

describe('Linear Search (manual)', () => {
  const data = ['Rosalia Indah', 'Sinar Jaya', 'Gunung Harta'].map((label) => ({ label }));

  it('menemukan target', () => {
    const r = linearSearchWithLog(data, (i) => i.label.toLowerCase().includes('sinar'), 'Sinar', (i) => i.label, 'BUS');
    expect(r.found).toBe(true);
    expect(r.index).toBe(1);
    expect(r.comparisons).toBe(2);
  });

  it('tidak menemukan target → memeriksa semua', () => {
    const r = linearSearchWithLog(data, (i) => i.label.includes('Hiba'), 'Hiba', (i) => i.label, 'BUS');
    expect(r.found).toBe(false);
    expect(r.index).toBe(-1);
    expect(r.comparisons).toBe(3);
  });

  it('dataset kosong', () => {
    const r = linearSearchWithLog([], () => true, 'x', (i: { label: string }) => i.label, 'BUS');
    expect(r.found).toBe(false);
    expect(r.comparisons).toBe(0);
  });
});

describe('Binary Search (manual)', () => {
  const sorted = prices([50000, 75000, 100000, 150000, 190000, 250000]);

  it('menemukan tarif pada data terurut', () => {
    const r = binarySearchWithLog(sorted, (i) => i.price, 150000, 'BUS');
    expect(r.found).toBe(true);
    expect(sorted[r.index].price).toBe(150000);
    expect(r.log.length).toBeGreaterThan(0);
    const withRange = r.log.find((s) => s.low !== undefined && s.mid !== undefined && s.high !== undefined);
    expect(withRange).toBeDefined();
  });

  it('target tidak ada', () => {
    const r = binarySearchWithLog(sorted, (i) => i.price, 123456, 'BUS');
    expect(r.found).toBe(false);
    expect(r.index).toBe(-1);
  });

  it('menolak data yang TIDAK terurut', () => {
    const unsorted = prices([3, 1, 2]);
    expect(() => binarySearchWithLog(unsorted, (i) => i.price, 1, 'BUS')).toThrowError(/terurut|sorted/i);
  });

  it('dataset kosong', () => {
    const r = binarySearchWithLog([], (i: { price: number }) => i.price, 100, 'BUS');
    expect(r.found).toBe(false);
  });
});

describe('Bubble Sort (manual)', () => {
  it('mengurutkan harga dengan benar dan menghitung tukar', () => {
    const items = prices([300000, 100000, 250000, 75000, 430000, 190000]);
    const { sorted, swaps, comparisons } = bubbleSortWithLog(items, (i) => i.price, 'BUS');
    expect(sorted.map((i) => i.price)).toEqual([75000, 100000, 190000, 250000, 300000, 430000]);
    expect(swaps).toBeGreaterThan(0);
    expect(comparisons).toBeGreaterThan(0);
  });

  it('data yang sudah terurut tidak ditukar sama sekali', () => {
    const { swaps } = bubbleSortWithLog(prices([1, 2, 3, 4]), (i) => i.price, 'BUS');
    expect(swaps).toBe(0);
  });

  it('menangani dataset kosong & satu elemen', () => {
    expect(bubbleSortWithLog([], (i: { price: number }) => i.price, 'BUS').sorted).toEqual([]);
    expect(bubbleSortWithLog(prices([5]), (i) => i.price, 'BUS').sorted.map((i) => i.price)).toEqual([5]);
  });

  it('hasil sama dengan urutan referensi untuk data acak deterministik', () => {
    const raw = Array.from({ length: 30 }, (_, i) => ((i * 104729) % 700) * 1000);
    const { sorted } = bubbleSortWithLog(prices(raw), (i) => i.price, 'TRAIN');
    expect(sorted.map((i) => i.price)).toEqual([...raw].sort((a, b) => a - b));
  });
});

describe('Visual frames (diagram batang / grid)', () => {
  it('setiap log langkah punya tepat satu frame dengan caption', () => {
    const items = prices([300000, 100000, 250000, 75000, 430000, 190000]);
    for (const res of [
      mergeSortWithLog(items, (i) => i.price, 'BUS'),
      bubbleSortWithLog(items, (i) => i.price, 'BUS'),
    ]) {
      expect(res.frames.length).toBe(res.log.length);
      for (const f of res.frames) {
        expect(f.caption.length).toBeGreaterThan(0);
        expect(f.order.length).toBe(items.length);
      }
      // frame terakhir = urutan terurut penuh
      const finalItems = res.frames[res.frames.length - 1].order.map((ix) => items[ix].price);
      expect(finalItems).toEqual([75000, 100000, 190000, 250000, 300000, 430000]);
      expect(res.frames[res.frames.length - 1].settled?.length).toBe(items.length);
    }
  });

  it('frame order selalu permutasi valid dari indeks item', () => {
    const items = prices([9, 3, 7, 3, 1, 8, 2]);
    const { frames } = mergeSortWithLog(items, (i) => i.price, 'BUS');
    for (const f of frames) {
      expect([...f.order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it('linear & binary search menghasilkan frame yang selaras dengan log', () => {
    const items = prices([100000, 200000, 300000]);
    const lin = linearSearchWithLog(items, (i) => i.price === 200000, '200000', (i) => i.price, 'BUS');
    expect(lin.frames.length).toBe(lin.log.length);
    expect(lin.frames[lin.frames.length - 1].foundIndex).toBe(1);

    const bin = binarySearchWithLog(items, (i) => i.price, 300000, 'BUS');
    expect(bin.frames.length).toBe(bin.log.length);
    expect(bin.frames[bin.frames.length - 1].foundIndex).toBe(2);
  });
});
