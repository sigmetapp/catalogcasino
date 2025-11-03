import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getRatingStars(rating: number): number[] {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  return Array(5)
    .fill(0)
    .map((_, i) => {
      if (i < fullStars) return 1;
      if (i === fullStars && hasHalfStar) return 0.5;
      return 0;
    });
}

/**
 * Transliterates Cyrillic characters to Latin
 */
function transliterate(text: string): string {
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Generates a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  // Transliterate Cyrillic to Latin
  let slug = transliterate(text);
  
  // Convert to lowercase
  slug = slug.toLowerCase();
  
  // Replace spaces and special characters with hyphens
  slug = slug.replace(/[^\w\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');
  
  // Remove multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-');
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Limit length to 100 characters
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
    slug = slug.replace(/-+$/, '');
  }
  
  return slug || 'casino';
}
