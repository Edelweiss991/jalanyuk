import { describe, it, expect } from 'vitest';
import { mergeSortWithLog, mergeSort } from '../src/algorithms/mergeSort';
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
