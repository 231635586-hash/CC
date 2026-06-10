import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 * 支持 clsx 的所有语法，并自动合并重复的 Tailwind 类
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期显示
 */
export function formatDate(date: string | Date, format: 'full' | 'short' | 'year-month' = 'full'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'full':
      return `${year}-${month}-${day}`;
    case 'short':
      return `${month}-${day}`;
    case 'year-month':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * 格式化货币显示
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

/**
 * 脱敏手机号
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏身份证号
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 18) return idCard;
  return idCard.replace(/(\d{4})\d+(\d{4})/, '$1**********$2');
}

/**
 * 脱敏银行卡号
 */
export function maskBankCard(cardNo: string): string {
  if (!cardNo || cardNo.length < 8) return cardNo;
  return cardNo.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
}