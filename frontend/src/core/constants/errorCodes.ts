// Centralized frontend ErrorCode → default Turkish message map.
// Generated from backend error_codes.py + DEFAULT_ERROR_MESSAGES.

export const ERROR_CODE_MESSAGES: Record<string, string> = {
  INTERNAL_SERVER_ERROR: "Sunucu hatası oluştu",
  VALIDATION_ERROR: "Girilen veriler geçersiz",
  INVALID_INPUT: "Geçersiz giriş",
  UNAUTHORIZED: "Yetkilendirme gerekli",
  FORBIDDEN: "Bu işlem için yetkiniz yok",
  NOT_FOUND: "Kayıt bulunamadı",
  CARI_NOT_FOUND: "Cari bulunamadı",
  CARI_DUPLICATE_CODE: "Bu cari kodu zaten kullanılıyor",
  CARI_INVALID_EMAIL: "Geçersiz email adresi",
  CARI_DELETE_HAS_RELATIONS: "Bu cari silinemez, ilişkili kayıtlar var",
  MOTORBOT_NOT_FOUND: "Motorbot bulunamadı",
  MOTORBOT_DUPLICATE_CODE: "Bu motorbot kodu zaten kullanılıyor",
  MOTORBOT_IN_USE: "Motorbot şu anda kullanımda",
  WO_NOT_FOUND: "İş emri bulunamadı",
  WO_INVALID_STATUS_TRANSITION: "Geçersiz durum geçişi",
  WO_ALREADY_INVOICED: "Bu iş emri zaten faturalandırılmış",
};

export function getErrorMessage(code: string, fallback?: string) {
  return ERROR_CODE_MESSAGES[code] || fallback || code;
}
